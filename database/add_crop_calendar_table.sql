-- Create crop_calendar table for planting and harvesting schedules
CREATE TABLE IF NOT EXISTS crop_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_name TEXT NOT NULL,
    category TEXT NOT NULL,
    planting_season_start INTEGER NOT NULL CHECK (planting_season_start >= 1 AND planting_season_start <= 12), -- Month (1-12)
    planting_season_end INTEGER NOT NULL CHECK (planting_season_end >= 1 AND planting_season_end <= 12), -- Month (1-12)
    harvesting_season_start INTEGER NOT NULL CHECK (harvesting_season_start >= 1 AND harvesting_season_start <= 12), -- Month (1-12)
    harvesting_season_end INTEGER NOT NULL CHECK (harvesting_season_end >= 1 AND harvesting_season_end <= 12), -- Month (1-12)
    growing_period_days INTEGER, -- Days from planting to harvest
    best_climate TEXT, -- e.g., "Temperate", "Tropical", "Subtropical"
    soil_type TEXT, -- e.g., "Loamy", "Sandy", "Clay"
    water_requirements TEXT, -- e.g., "High", "Medium", "Low"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create crop_rotation_suggestions table
CREATE TABLE IF NOT EXISTS crop_rotation_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_name TEXT NOT NULL,
    recommended_next_crops TEXT[] NOT NULL, -- Array of crop names
    avoid_next_crops TEXT[], -- Array of crop names to avoid
    rotation_benefits TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crop_calendar_category ON crop_calendar(category);
CREATE INDEX IF NOT EXISTS idx_crop_calendar_crop_name ON crop_calendar(crop_name);
CREATE INDEX IF NOT EXISTS idx_crop_rotation_crop_name ON crop_rotation_suggestions(crop_name);

-- Insert sample crop calendar data
INSERT INTO crop_calendar (crop_name, category, planting_season_start, planting_season_end, harvesting_season_start, harvesting_season_end, growing_period_days, best_climate, soil_type, water_requirements, description) VALUES
('Rice', 'grain', 6, 7, 10, 11, 120, 'Tropical', 'Clay', 'High', 'Main crop of Nepal, requires standing water'),
('Wheat', 'grain', 10, 11, 3, 4, 120, 'Temperate', 'Loamy', 'Medium', 'Winter crop, planted in late autumn'),
('Maize', 'grain', 4, 5, 8, 9, 90, 'Tropical', 'Loamy', 'Medium', 'Summer crop, requires warm weather'),
('Tomato', 'vegetable', 2, 3, 5, 7, 90, 'Temperate', 'Loamy', 'Medium', 'Warm season crop, requires support'),
('Potato', 'vegetable', 10, 11, 2, 3, 120, 'Temperate', 'Sandy', 'Medium', 'Cool season crop, planted in autumn'),
('Onion', 'vegetable', 10, 11, 4, 5, 150, 'Temperate', 'Loamy', 'Low', 'Long growing season, planted in autumn'),
('Cabbage', 'vegetable', 9, 10, 1, 2, 90, 'Temperate', 'Loamy', 'High', 'Cool season crop'),
('Cauliflower', 'vegetable', 9, 10, 1, 2, 100, 'Temperate', 'Loamy', 'High', 'Cool season crop, requires consistent moisture'),
('Mango', 'fruit', 6, 7, 4, 6, 120, 'Tropical', 'Loamy', 'Medium', 'Tropical fruit tree, long growing period'),
('Apple', 'fruit', 1, 2, 8, 10, 180, 'Temperate', 'Loamy', 'Medium', 'Temperate fruit tree, requires cold winter'),
('Banana', 'fruit', 3, 4, 9, 12, 270, 'Tropical', 'Loamy', 'High', 'Tropical fruit, requires consistent water'),
('Chili', 'spice and herb', 2, 3, 6, 9, 120, 'Tropical', 'Loamy', 'Medium', 'Warm season crop, multiple harvests'),
('Ginger', 'spice and herb', 3, 4, 10, 12, 240, 'Tropical', 'Loamy', 'High', 'Tropical spice, requires shade'),
('Turmeric', 'spice and herb', 3, 4, 10, 12, 270, 'Tropical', 'Loamy', 'High', 'Tropical spice, similar to ginger');

-- Insert sample crop rotation suggestions
INSERT INTO crop_rotation_suggestions (crop_name, recommended_next_crops, avoid_next_crops, rotation_benefits) VALUES
('Rice', ARRAY['Wheat', 'Potato', 'Mustard'], ARRAY['Rice'], 'Rice depletes nitrogen; legumes and wheat restore it'),
('Wheat', ARRAY['Rice', 'Maize', 'Soybean'], ARRAY['Wheat', 'Barley'], 'Wheat benefits from nitrogen-fixing crops'),
('Maize', ARRAY['Wheat', 'Potato', 'Legumes'], ARRAY['Maize'], 'Maize benefits from nitrogen-rich soil'),
('Tomato', ARRAY['Beans', 'Cabbage', 'Onion'], ARRAY['Tomato', 'Potato', 'Pepper'], 'Prevents soil-borne diseases'),
('Potato', ARRAY['Wheat', 'Maize', 'Beans'], ARRAY['Potato', 'Tomato'], 'Prevents nematode buildup'),
('Onion', ARRAY['Tomato', 'Cabbage', 'Carrot'], ARRAY['Onion', 'Garlic'], 'Prevents disease accumulation');

