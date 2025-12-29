-- Migration to update offers_status_check constraint to include pickup statuses

-- Drop the existing constraint
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_status_check;

-- Add the updated constraint with pickup statuses
ALTER TABLE offers ADD CONSTRAINT offers_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'to_ship', 'shipped', 'delivered', 'received', 'ready_for_pickup', 'picked_up', 'completed', 'cancelled', 'expired'));
