-- Create trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for each table
CREATE TRIGGER update_leave_types_updated_at
    BEFORE UPDATE ON "leave_types"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_policies_updated_at
    BEFORE UPDATE ON "leave_policies"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holiday_calendars_updated_at
    BEFORE UPDATE ON "holiday_calendars"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employment_types_updated_at
    BEFORE UPDATE ON "employment_types"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_policy_employment_types_updated_at
    BEFORE UPDATE ON "leave_policy_employment_types"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();