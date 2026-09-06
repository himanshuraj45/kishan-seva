-- KisanSeva Supabase Schema

CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    farmer_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    score INTEGER NOT NULL,
    status VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    crop VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_quintal INTEGER NOT NULL,
    quality_grade VARCHAR(255) NOT NULL,
    delivery_date VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_rating DOUBLE PRECISION NOT NULL,
    buyer_verified BOOLEAN NOT NULL,
    status VARCHAR(255) NOT NULL,
    distance DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(255) PRIMARY KEY,
    authorname VARCHAR(255) NOT NULL,
    authorlocation VARCHAR(255) NOT NULL,
    avatarcolor VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    tags TEXT NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS replies (
    id VARCHAR(255) PRIMARY KEY,
    postid VARCHAR(255) NOT NULL,
    authorname VARCHAR(255) NOT NULL,
    authortype VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial data for community posts
INSERT INTO posts (id, authorname, authorlocation, avatarcolor, content, likes, tags, createdat)
VALUES 
('p1', 'Ramesh Patel', 'Nashik, Maharashtra', 'bg-orange-500', 'Just harvested my first batch of organic tomatoes using the new drip irrigation system! Yield is up by 20% compared to last season. Happy to share tips with anyone looking to transition.', 45, '["Organic", "Harvest", "Success Story"]', NOW() - INTERVAL '2 hours'),
('p2', 'Vikram Singh', 'Ludhiana, Punjab', 'bg-emerald-500', 'My wheat crop is showing yellowing on the lower leaves. The soil moisture is optimal. Could this be a Nitrogen deficiency or something else?', 12, '["Crop Health", "Wheat", "Help Required"]', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO replies (id, postid, authorname, authortype, content, likes, createdat)
VALUES 
('r1', 'p1', 'Suresh Kumar', 'farmer', 'Bhai, which brand of drip pipes did you use? Did you get any government subsidy?', 5, NOW() - INTERVAL '1 hours'),
('r2', 'p2', 'KisanSeva AI Expert', 'ai', 'Yellowing of lower/older leaves in wheat is a classic symptom of **Nitrogen (N) deficiency**, as the plant moves mobile nutrients to new growth. \n\n**Action Plan:**\n1. Apply a top dressing of Urea (around 20-25 kg/acre) before your next irrigation.\n2. Alternatively, spray a 2% Urea solution directly on the leaves for faster absorption.\n3. Verify soil pH; if too high/low, Nitrogen uptake may be locked out.', 38, NOW() - INTERVAL '1 hours')
ON CONFLICT (id) DO NOTHING;
