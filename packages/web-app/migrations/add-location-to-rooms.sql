-- Add geolocation to rooms table using PostGIS
-- Run this in your Supabase SQL Editor

-- Enable PostGIS extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location column using geography type with Point geometry
-- SRID 4326 is WGS84 (standard GPS coordinates)
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Add index for spatial queries (improves performance)
CREATE INDEX IF NOT EXISTS idx_rooms_location ON rooms USING GIST (location);

-- Add helper function to create a point from lat/lng
CREATE OR REPLACE FUNCTION make_point(lng double precision, lat double precision)
RETURNS geography AS $$
  SELECT ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
$$ LANGUAGE SQL IMMUTABLE;

-- Add helper function to get latitude from geography point
CREATE OR REPLACE FUNCTION get_latitude(location geography)
RETURNS double precision AS $$
  SELECT ST_Y(location::geometry);
$$ LANGUAGE SQL IMMUTABLE;

-- Add helper function to get longitude from geography point
CREATE OR REPLACE FUNCTION get_longitude(location geography)
RETURNS double precision AS $$
  SELECT ST_X(location::geometry);
$$ LANGUAGE SQL IMMUTABLE;

-- Example: Update a room with coordinates (San Francisco)
-- UPDATE rooms 
-- SET location = ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography
-- WHERE id = 'your-room-id';

-- Example: Find rooms within 10km of a point
-- SELECT *, ST_Distance(location, ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography) / 1000 as distance_km
-- FROM rooms
-- WHERE location IS NOT NULL
-- AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography, 10000)
-- ORDER BY distance_km;

COMMENT ON COLUMN rooms.location IS 'Geographic location of the room (WGS84 coordinates)';

