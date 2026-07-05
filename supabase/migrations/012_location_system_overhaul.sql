-- Enable PostGIS extension for geography/distance calculations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS governorate text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS location_sharing_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS precise_lat double precision,
ADD COLUMN IF NOT EXISTS precise_lng double precision;

-- Add location fields to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS listing_lat double precision,
ADD COLUMN IF NOT EXISTS listing_lng double precision;

-- Create indexes for efficient location queries
CREATE INDEX IF NOT EXISTS profiles_location_sharing_idx ON public.profiles(location_sharing_enabled);
CREATE INDEX IF NOT EXISTS profiles_governorate_idx ON public.profiles(governorate);
CREATE INDEX IF NOT EXISTS profiles_city_idx ON public.profiles(city);
CREATE INDEX IF NOT EXISTS listings_location_coords_idx ON public.listings(listing_lat, listing_lng) WHERE listing_lat IS NOT NULL AND listing_lng IS NOT NULL;

-- Create function for distance-sorted listings
CREATE OR REPLACE FUNCTION public.get_distance_sorted_listings(
  p_user_id text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id text,
  seller_id text,
  name text,
  brand text,
  size text,
  price numeric,
  description text,
  category text,
  condition text,
  images text[],
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  featured_until timestamptz,
  listing_lat double precision,
  listing_lng double precision,
  profiles_id text,
  profiles_name text,
  profiles_handle text,
  profiles_avatar_url text,
  profiles_bio text,
  profiles_location text,
  profiles_rating numeric,
  profiles_review_count integer,
  profiles_swap_count integer,
  profiles_saved_listings text[],
  profiles_created_at timestamptz,
  profiles_updated_at timestamptz,
  profiles_governorate text,
  profiles_city text,
  profiles_location_sharing_enabled boolean,
  profiles_precise_lat double precision,
  profiles_precise_lng double precision,
  distance double precision
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_lat double precision;
  v_user_lng double precision;
  v_user_city text;
BEGIN
  -- Get user's location if they have location sharing enabled
  IF p_user_id IS NOT NULL THEN
    SELECT precise_lat, precise_lng, city
    INTO v_user_lat, v_user_lng, v_user_city
    FROM public.profiles
    WHERE id = p_user_id AND location_sharing_enabled = true;
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.seller_id,
    l.name,
    l.brand,
    l.size,
    l.price,
    l.description,
    l.category,
    l.condition,
    l.images,
    l.status,
    l.created_at,
    l.updated_at,
    l.featured_until,
    l.listing_lat,
    l.listing_lng,
    p.id as profiles_id,
    p.name as profiles_name,
    p.handle as profiles_handle,
    p.avatar_url as profiles_avatar_url,
    p.bio as profiles_bio,
    p.location as profiles_location,
    p.rating as profiles_rating,
    p.review_count as profiles_review_count,
    p.swap_count as profiles_swap_count,
    p.saved_listings as profiles_saved_listings,
    p.created_at as profiles_created_at,
    p.updated_at as profiles_updated_at,
    p.governorate as profiles_governorate,
    p.city as profiles_city,
    p.location_sharing_enabled as profiles_location_sharing_enabled,
    p.precise_lat as profiles_precise_lat,
    p.precise_lng as profiles_precise_lng,
    CASE
      WHEN l.listing_lat IS NOT NULL AND l.listing_lng IS NOT NULL
        AND v_user_lat IS NOT NULL AND v_user_lng IS NOT NULL
      THEN ST_Distance(
        ST_MakePoint(l.listing_lng, l.listing_lat)::geography,
        ST_MakePoint(v_user_lng, v_user_lat)::geography
      )
      ELSE NULL
    END as distance
  FROM public.listings l
  LEFT JOIN public.profiles p ON l.seller_id = p.id
  WHERE l.status = 'active'
  ORDER BY
    distance ASC NULLS LAST,
    CASE WHEN COALESCE(p.city, '') = COALESCE(v_user_city, '') THEN 0 ELSE 1 END,
    l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_distance_sorted_listings TO authenticated;

