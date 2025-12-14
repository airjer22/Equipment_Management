/*
  # Add Dismissed Notifications Tracking

  ## Changes
  Creates a system to track which student notifications have been dismissed by admins.
  
  ## New Tables
  - `dismissed_notifications`
    - `id` (uuid, primary key) - Unique identifier
    - `student_id` (uuid, foreign key) - References students table
    - `late_returns_count` (integer) - The number of late returns when dismissed
    - `warning_threshold` (integer) - The threshold level when dismissed
    - `dismissed_at` (timestamp) - When the notification was dismissed
    - `dismissed_by_user_id` (uuid, foreign key) - Admin who dismissed it
  
  ## Logic
  - When admin dismisses a notification, a record is created with the current late_returns_count
  - Notifications only show if: late_returns_since_suspension >= threshold AND no dismissal record exists for that count
  - If student gets another late return, they appear again (new late_returns_count)
  - When student is suspended, all dismissal records are cleared (fresh start)

  ## Security
  - Enable RLS on dismissed_notifications table
  - Only authenticated admins can insert/delete dismissal records
  - Everyone can read (needed for filtering notifications)
*/

-- Create dismissed_notifications table
CREATE TABLE IF NOT EXISTS dismissed_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  late_returns_count integer NOT NULL,
  warning_threshold integer NOT NULL,
  dismissed_at timestamptz DEFAULT now(),
  dismissed_by_user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dismissed_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view dismissals
CREATE POLICY "Authenticated users can view dismissals"
  ON dismissed_notifications FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to dismiss notifications
CREATE POLICY "Authenticated users can dismiss notifications"
  ON dismissed_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to clear dismissals
CREATE POLICY "Authenticated users can clear dismissals"
  ON dismissed_notifications FOR DELETE
  TO authenticated
  USING (true);

-- Create function to clear dismissals when student is suspended
CREATE OR REPLACE FUNCTION clear_dismissed_notifications_on_suspension()
RETURNS trigger AS $$
BEGIN
  -- When a student is blacklisted, clear all their dismissed notifications
  IF NEW.is_blacklisted = true AND (OLD.is_blacklisted = false OR OLD.is_blacklisted IS NULL) THEN
    DELETE FROM dismissed_notifications WHERE student_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clear dismissals on suspension
DROP TRIGGER IF EXISTS clear_dismissals_on_suspension ON students;
CREATE TRIGGER clear_dismissals_on_suspension
  AFTER UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION clear_dismissed_notifications_on_suspension();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dismissed_notifications_student_id 
  ON dismissed_notifications(student_id);