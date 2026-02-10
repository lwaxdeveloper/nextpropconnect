-- Seed Script: 50 Gauteng Listings + 3 Agent Profiles
-- Run: docker exec -i supabase-db psql -U postgres -d propconnect < scripts/seed-properties.sql

BEGIN;

-- Create agent users (password: Agent123!)
-- bcrypt hash for "Agent123!"
INSERT INTO users (email, password_hash, name, phone, role, is_verified) VALUES
  ('sarah.m@propconnect.co.za', '$2a$10$LQ3XYFD7P.8K7dI6JiVsHuqK0SLnRfjx6bwJ0BPdUzJmYNjQxN/4e', 'Sarah Mokwena', '082 345 6789', 'agent', true),
  ('james.v@propconnect.co.za', '$2a$10$LQ3XYFD7P.8K7dI6JiVsHuqK0SLnRfjx6bwJ0BPdUzJmYNjQxN/4e', 'James van der Merwe', '083 456 7890', 'agent', true),
  ('thandi.n@propconnect.co.za', '$2a$10$LQ3XYFD7P.8K7dI6JiVsHuqK0SLnRfjx6bwJ0BPdUzJmYNjQxN/4e', 'Thandi Nkosi', '084 567 8901', 'agent', true)
ON CONFLICT (email) DO NOTHING;

-- Create a regular user/owner
INSERT INTO users (email, password_hash, name, phone, role) VALUES
  ('owner@propconnect.co.za', '$2a$10$LQ3XYFD7P.8K7dI6JiVsHuqK0SLnRfjx6bwJ0BPdUzJmYNjQxN/4e', 'Mike Patel', '079 123 4567', 'seller')
ON CONFLICT (email) DO NOTHING;

-- Agent profiles
INSERT INTO agent_profiles (user_id, agency_name, eaab_number, ffc_number, bio, areas_served, specializations, years_experience, commission_rate, trust_score, is_verified)
SELECT u.id,
  'Mokwena Properties',
  'EAAB-2019-0847',
  'FFC-2024-1234',
  'Born and raised in Boksburg. I know the East Rand like the back of my hand — from Benoni to Springs, Germiston to Alberton. I specialise in family homes and first-time buyers. If you want an agent who actually picks up the phone, I am your person.',
  ARRAY['Boksburg', 'Benoni', 'Germiston', 'Alberton', 'Springs'],
  ARRAY['Residential', 'First-time Buyers'],
  8,
  5.00,
  82,
  true
FROM users u WHERE u.email = 'sarah.m@propconnect.co.za'
ON CONFLICT DO NOTHING;

INSERT INTO agent_profiles (user_id, agency_name, eaab_number, ffc_number, bio, areas_served, specializations, years_experience, commission_rate, trust_score, is_verified)
SELECT u.id,
  'VDM Estates',
  'EAAB-2015-0392',
  'FFC-2024-5678',
  'Focused on Sandton, Fourways, and the northern suburbs. Whether you are looking for a penthouse in Sandhurst or a cluster in Lonehill, I have been in this market for 12 years and I know every complex, every body corporate, every security estate. Let me find your dream home.',
  ARRAY['Sandton', 'Fourways', 'Bryanston', 'Randburg', 'Midrand'],
  ARRAY['Luxury', 'Sectional Title', 'Investment'],
  12,
  6.00,
  91,
  true
FROM users u WHERE u.email = 'james.v@propconnect.co.za'
ON CONFLICT DO NOTHING;

INSERT INTO agent_profiles (user_id, agency_name, eaab_number, bio, areas_served, specializations, years_experience, commission_rate, trust_score, is_verified)
SELECT u.id,
  'Nkosi Realty',
  'EAAB-2020-1205',
  'I started in property because I saw how hard it was for people in Soweto and surrounding areas to find proper listings online. Everyone deserves a fair deal. I cover the south of Joburg, Soweto, and the Vaal. Straight-talking, no nonsense.',
  ARRAY['Soweto', 'Johannesburg South', 'Centurion', 'Midrand'],
  ARRAY['Residential', 'Township Properties', 'Affordable Housing'],
  5,
  4.50,
  75,
  false
FROM users u WHERE u.email = 'thandi.n@propconnect.co.za'
ON CONFLICT DO NOTHING;

-- Now insert 50 properties
-- We'll use a mix of agent-listed and owner-listed

-- Get agent IDs
DO $$
DECLARE
  sarah_agent_id INT;
  james_agent_id INT;
  thandi_agent_id INT;
  sarah_user_id INT;
  james_user_id INT;
  thandi_user_id INT;
  owner_user_id INT;
BEGIN
  SELECT u.id INTO sarah_user_id FROM users u WHERE u.email = 'sarah.m@propconnect.co.za';
  SELECT u.id INTO james_user_id FROM users u WHERE u.email = 'james.v@propconnect.co.za';
  SELECT u.id INTO thandi_user_id FROM users u WHERE u.email = 'thandi.n@propconnect.co.za';
  SELECT u.id INTO owner_user_id FROM users u WHERE u.email = 'owner@propconnect.co.za';

  SELECT ap.id INTO sarah_agent_id FROM agent_profiles ap WHERE ap.user_id = sarah_user_id;
  SELECT ap.id INTO james_agent_id FROM agent_profiles ap WHERE ap.user_id = james_user_id;
  SELECT ap.id INTO thandi_agent_id FROM agent_profiles ap WHERE ap.user_id = thandi_user_id;

  -- =====================
  -- HOUSES FOR SALE (18)
  -- =====================

  INSERT INTO properties (user_id, agent_id, title, description, property_type, listing_type, price, street_address, suburb, city, province, postal_code, bedrooms, bathrooms, garages, parking_spaces, floor_size, erf_size, year_built, has_pool, has_garden, has_security, has_pet_friendly, is_furnished, status, is_featured, views_count) VALUES

  (sarah_user_id, sarah_agent_id, 'Spacious family home with pool in Bartlett', 
  'This is one of those houses that just feels right the moment you walk in. Open-plan living and dining flows into a modern kitchen with granite tops and gas hob. The main bedroom has a walk-in closet and full en-suite. Three more bedrooms share a bathroom upstairs. Outside you have got a sparkling pool, covered patio with built-in braai, and a double garage. Bartlett is quiet, family-friendly, and close to East Rand Mall.

The sellers are relocating and this one will not last. Priced to sell.',
  'house', 'sale', 2350000, '42 Acacia Lane', 'Bartlett', 'Boksburg', 'Gauteng', '1459', 4, 2, 2, 2, 220, 680, 1998, true, true, true, true, false, 'active', true, 147),

  (sarah_user_id, sarah_agent_id, 'Neat 3-bed in Witfield — Move-in Ready',
  'Well-maintained family home in the heart of Witfield. Three good-sized bedrooms, two bathrooms, open-plan lounge and dining room. Recently renovated kitchen with new cupboards. Single garage plus carport for two cars. Nice garden, fully walled with electric fencing. Walking distance to Boksburg Lake and close to OR Tambo.',
  'house', 'sale', 1650000, '18 Tulip Street', 'Witfield', 'Boksburg', 'Gauteng', '1459', 3, 2, 1, 3, 165, 550, 2003, false, true, true, false, false, 'active', true, 89),

  (sarah_user_id, sarah_agent_id, 'Modern 4-bed with flatlet in Benoni',
  'Beautiful modern home with a separate flatlet — perfect for Airbnb or in-laws. Main house has 4 bedrooms, 2.5 bathrooms, open-plan kitchen with island, and a spacious lounge with fireplace. Flatlet has its own entrance with 1 bed, 1 bath, kitchenette. Double automated garage. Borehore and solar panels installed. Alarm and armed response.',
  'house', 'sale', 2850000, '7 Jacaranda Ave', 'Farrarmere', 'Benoni', 'Gauteng', '1501', 4, 3, 2, 4, 280, 900, 2012, true, true, true, true, false, 'active', false, 203),

  (james_user_id, james_agent_id, 'Executive home in Bryanston — Entertainers Dream',
  'If you love hosting, this is your house. Massive open-plan living area opens onto a covered patio overlooking the pool and manicured garden. Chef kitchen with Smeg appliances, marble counters, and scullery. Four en-suite bedrooms upstairs, study downstairs. Staff quarters. Triple garage. Full security with CCTV. In a boomed-off street within walking distance of Bryanston High.',
  'house', 'sale', 4950000, '12 Oak Ridge', 'Bryanston', 'Johannesburg', 'Gauteng', '2191', 4, 4, 3, 6, 380, 1200, 2008, true, true, true, true, false, 'active', true, 312),

  (james_user_id, james_agent_id, 'Sandton cluster in secure estate',
  'Low-maintenance living in one of Sandton best estates. Three bedrooms, two and a half bathrooms, double-volume entrance, modern finishes throughout. Private garden with built-in braai area. Double garage with direct access. 24-hour security, communal pool and clubhouse. Walking distance to Sandton City and Gautrain.',
  'house', 'sale', 3750000, 'Unit 14 Sandton Grove', 'Sandton', 'Johannesburg', 'Gauteng', '2196', 3, 3, 2, 2, 210, 350, 2016, false, true, true, false, false, 'active', true, 178),

  (thandi_user_id, thandi_agent_id, 'Upgraded family home in Protea Glen, Soweto',
  'This home has been completely renovated and it shows. New tiles throughout, fitted kitchen, modern bathroom with shower and bath. Three bedrooms, all a good size. Walled with gate, carport for two cars. The yard is big enough for an extension or a outside room. Close to Protea Glen Mall and taxi routes. This is what township property should look like — well-built and taken care of.',
  'house', 'sale', 980000, '1247 Tulip Crescent', 'Protea Glen', 'Soweto', 'Gauteng', '1818', 3, 1, 0, 2, 120, 350, 2005, false, true, false, false, false, 'active', true, 267),

  (thandi_user_id, thandi_agent_id, 'Neat 3-bed in Centurion with double garage',
  'Good solid home in a quiet Centurion street. Three bedrooms, two bathrooms, lounge and separate TV room. Kitchen has been updated with new counters. Double garage, lapa in the back with braai. Small pool. Close to Centurion Mall, Gautrain, and the N1. Great for a young family or downsizing couple.',
  'house', 'sale', 1890000, '55 Bokmakierie Street', 'Eldoraigne', 'Centurion', 'Gauteng', '0157', 3, 2, 2, 2, 185, 600, 2001, true, true, true, false, false, 'active', false, 95),

  (owner_user_id, NULL, 'Charming cottage in Melville — Owner Selling',
  'Selling my little Melville gem after 8 years. It is a 2-bed, 1-bath cottage with loads of character. Wooden floors, high ceilings, original fireplace. The garden is private and peaceful — you would not believe you are 5 minutes from the city. Off-street parking for 2 cars. I have loved living here, but it is time for the next chapter. No agents, serious buyers only.',
  'house', 'sale', 1450000, '33 Fourth Avenue', 'Melville', 'Johannesburg', 'Gauteng', '2092', 2, 1, 0, 2, 110, 380, 1965, false, true, false, true, false, 'active', false, 134),

  (sarah_user_id, sarah_agent_id, 'Starter home in Kempton Park — Under R1M',
  'Perfect first home or investment property. Three bedrooms, one bathroom, open-plan kitchen and living. Recently painted inside and out. New geyser installed last year. Single garage, neat garden. Quiet street close to Kempton Park CBD and the R21. Levies: None. Rates: approximately R1,200/month.',
  'house', 'sale', 950000, '12 Iris Street', 'Kempton Park Central', 'Kempton Park', 'Gauteng', '1619', 3, 1, 1, 1, 110, 400, 1992, false, true, false, false, false, 'active', false, 56),

  (james_user_id, james_agent_id, 'Stunning 5-bed in Fourways Gardens Estate',
  'This is luxury done right. Five bedrooms — all en-suite. Open-plan kitchen, dining, and family room with stacking doors leading to the pool deck. Separate lounge with gas fireplace. Study. Double-volume entrance. Staff suite. Triple garage plus extra storage. 24/7 estate security. In the catchment for Fourways High. The finishes in this home will blow you away.',
  'house', 'sale', 4500000, '8 Eagles Landing', 'Fourways Gardens', 'Johannesburg', 'Gauteng', '2191', 5, 5, 3, 6, 420, 1500, 2015, true, true, true, true, false, 'active', true, 445),

  (sarah_user_id, sarah_agent_id, 'Renovated home in Alberton North',
  'Fully renovated 3-bed with modern finishes. New kitchen, new bathrooms, new electrical. Open-plan living that flows to a covered patio. Double garage with extra storage room. Nice garden with space for a pool. Close to Alberton Mall and easy access to the N12. This one is a stunner — come see for yourself.',
  'house', 'sale', 1780000, '29 Elm Road', 'Alberton North', 'Alberton', 'Gauteng', '1449', 3, 2, 2, 3, 175, 620, 1995, false, true, true, false, false, 'active', false, 72),

  (thandi_user_id, thandi_agent_id, 'Solid 4-bed family home in Midrand',
  'Spacious family home on a large stand in Midrand. Four bedrooms, two bathrooms, separate lounge and TV room. Big kitchen with pantry. Lapa, pool, and double garage. The stand is over 1000sqm — rare in Midrand at this price. Close to Mall of Africa and Midrand schools. This one ticks all the boxes.',
  'house', 'sale', 2200000, '14 Crane Lane', 'Halfway House', 'Midrand', 'Gauteng', '1685', 4, 2, 2, 4, 240, 1050, 2004, true, true, true, true, false, 'active', false, 168),

  (james_user_id, james_agent_id, 'Contemporary home in Randburg',
  'Architecturally designed home in a quiet Randburg cul-de-sac. Three bedrooms plus study that could be a 4th. Main en-suite with double vanity and walk-in shower. Sleek kitchen with integrated appliances. Covered entertainment area with built-in braai and lap pool. Low-maintenance garden. Double automated garage. Solar geyser and inverter backup.',
  'house', 'sale', 2650000, '6 Willow Close', 'Northcliff', 'Randburg', 'Gauteng', '2115', 3, 2, 2, 3, 230, 650, 2018, true, true, true, false, false, 'active', false, 119),

  (owner_user_id, NULL, 'Big 4-bed in Germiston — Great for a big family',
  'If you need space, this is it. Four big bedrooms, two full bathrooms, formal lounge, family room, and a huge kitchen with breakfast nook. Outbuilding at the back with bathroom — could be a flatlet or home office. Double carport and lots of off-street parking. Garden is massive, kids will love it. Close to Germiston Lake and schools. I am selling privately to keep costs down.',
  'house', 'sale', 1350000, '88 Delver Street', 'Lambton', 'Germiston', 'Gauteng', '1401', 4, 2, 0, 4, 250, 850, 1988, false, true, true, false, false, 'active', false, 43),

  (sarah_user_id, sarah_agent_id, 'Immaculate home in Roodepoort',
  'This home is in pristine condition. The owners have maintained it beautifully over 15 years. Three bedrooms, 2 bathrooms, study nook, open-plan living. Modern kitchen with gas hob and eye-level oven. Covered patio, pool, and landscaped garden. Single garage plus double carport. In a secure complex with guardhouse. Close to Clearwater Mall.',
  'house', 'sale', 1950000, '22 Sunflower Ave', 'Wilgeheuwel', 'Roodepoort', 'Gauteng', '1724', 3, 2, 1, 3, 195, 500, 2009, true, true, true, true, false, 'active', false, 88),

  (thandi_user_id, thandi_agent_id, 'Investment opportunity in Springs',
  'Solid 3-bed house on a large stand with potential to subdivide. Main house has 3 beds, 1 bath, lounge, kitchen, single garage. Outbuilding at the back already has plumbing for a second unit. This is a great buy-to-let opportunity or a development play. Springs market is growing fast. Priced to sell quickly.',
  'house', 'sale', 850000, '61 Market Street', 'Springs Central', 'Springs', 'Gauteng', '1559', 3, 1, 1, 2, 130, 800, 1975, false, true, false, false, false, 'active', false, 37),

  (sarah_user_id, sarah_agent_id, 'Modern cluster in Barbeque Downs, Midrand',
  'Like-new cluster home in a secure complex. Three bedrooms upstairs, open-plan living downstairs. Kitchen has soft-close cupboards and stone counters. Small private garden with braai area. Double garage with direct access. Complex has pool, playground, and 24hr security. Close to N1 and Allandale offramp. Perfect lock-up-and-go.',
  'house', 'sale', 2100000, 'Unit 7 Acacia Close', 'Barbeque Downs', 'Midrand', 'Gauteng', '1684', 3, 2, 2, 2, 170, 250, 2020, false, true, true, false, false, 'active', false, 62),

  (james_user_id, james_agent_id, 'Character home in Linden',
  'Charming older home with loads of character and modern upgrades. Three bedrooms, two bathrooms, separate study. Original wooden floors and features combined with a newly fitted kitchen. Big covered veranda overlooking a lush garden. Pool. Double carport. In one of Linden most popular streets, walking distance to great restaurants and shops on 4th Ave.',
  'house', 'sale', 2750000, '17 Second Street', 'Linden', 'Johannesburg', 'Gauteng', '2195', 3, 2, 0, 2, 200, 700, 1958, true, true, false, true, false, 'active', false, 155),

  -- =====================
  -- APARTMENTS FOR SALE (7)
  -- =====================

  (james_user_id, james_agent_id, '2-bed apartment in Sandton Central',
  'Modern 2-bed apartment in the heart of Sandton. Open-plan kitchen and living with balcony overlooking the city. Both bedrooms have built-in cupboards, main is en-suite. One basement parking bay and storage unit. Building has gym, pool, and 24hr concierge. Walk to Sandton City, Nelson Mandela Square, and the Gautrain. Ideal for young professionals or investors — current tenant paying R12,000/month.',
  'apartment', 'sale', 1650000, 'Unit 1204 Sandton Towers', 'Sandton Central', 'Johannesburg', 'Gauteng', '2196', 2, 2, 0, 1, 75, NULL, 2017, false, false, true, false, false, 'active', true, 234),

  (james_user_id, james_agent_id, 'Studio apartment in Rosebank',
  'Compact and stylish studio in the Rosebank hub. Open-plan with modern kitchen, full bathroom, and enough space for a king bed and lounge area. One parking bay. Building has rooftop pool, gym, and fibre internet included in levy. Perfect for a single professional or as an investment. Steps from Rosebank Mall and the Gautrain.',
  'apartment', 'sale', 950000, 'Unit 302 The Zone', 'Rosebank', 'Johannesburg', 'Gauteng', '2196', 1, 1, 0, 1, 42, NULL, 2019, false, false, true, false, true, 'active', false, 167),

  (sarah_user_id, sarah_agent_id, '2-bed ground floor in Kempton Park',
  'Neat ground-floor apartment in a well-run complex. Two bedrooms with built-ins, one bathroom, open-plan living and kitchen. Small private garden — rare for an apartment. One covered carport. Complex has communal pool and braai area. Close to Kempton Park CBD and R21. Levy includes water. Great first buy.',
  'apartment', 'sale', 680000, 'Unit 3 Lilac Gardens', 'Kempton Park', 'Kempton Park', 'Gauteng', '1619', 2, 1, 0, 1, 65, NULL, 2010, false, true, true, false, false, 'active', false, 45),

  (thandi_user_id, thandi_agent_id, 'Spacious 3-bed apartment in Centurion',
  'Top-floor apartment with views for days. Three bedrooms, two bathrooms, big lounge and dining room, kitchen with separate scullery. Two parking bays. Complex is well-managed with pool, playground, and security gate. Close to Centurion Mall and Gautrain. Levies are reasonable at R2,300/month.',
  'apartment', 'sale', 1150000, 'Unit 22 Highveld Heights', 'Highveld', 'Centurion', 'Gauteng', '0157', 3, 2, 0, 2, 105, NULL, 2014, false, false, true, false, false, 'active', false, 78),

  (owner_user_id, NULL, '1-bed in Midrand — Below market value',
  'Selling my 1-bed apartment because I am emigrating. Below market value for a quick sale. Modern finishes, open-plan, balcony, one parking bay. Building is 5 years old with gym and pool. Close to Mall of Africa. Currently tenanted at R7,500/month — can sell with tenant in place. Serious offers only.',
  'apartment', 'sale', 620000, 'Unit 508 City View', 'Carlswald', 'Midrand', 'Gauteng', '1685', 1, 1, 0, 1, 48, NULL, 2021, false, false, true, false, false, 'active', false, 198),

  (sarah_user_id, sarah_agent_id, '2-bed in Boksburg with lake views',
  'Lovely 2-bed apartment overlooking Boksburg Lake. Open-plan living with large windows that let in tons of natural light. Modern kitchen and bathroom. One parking bay plus visitor parking. Complex pool and braai. Walking distance to East Rand Mall and the lake promenade. This view is hard to beat at this price.',
  'apartment', 'sale', 780000, 'Unit 8 Lakeside Manor', 'Boksburg', 'Boksburg', 'Gauteng', '1459', 2, 1, 0, 1, 70, NULL, 2016, false, false, true, false, false, 'active', false, 92),

  (james_user_id, james_agent_id, 'Luxury penthouse in Fourways',
  'Stunning duplex penthouse with panoramic views. Three beds, three baths, open-plan living with double-volume ceilings. Private rooftop terrace with jacuzzi. Imported Italian kitchen. Two parking bays plus storeroom. Building has concierge, gym, pool, and business centre. This is penthouse living at its best.',
  'apartment', 'sale', 3200000, 'PH1 The Pinnacle', 'Fourways', 'Johannesburg', 'Gauteng', '2191', 3, 3, 0, 2, 165, NULL, 2022, false, false, true, false, true, 'active', true, 356),

  -- =====================
  -- TOWNHOUSES FOR SALE (5)
  -- =====================

  (sarah_user_id, sarah_agent_id, 'Modern townhouse in Greenstone Hill',
  'Brand new 3-bed townhouse in a sought-after estate. Double-storey with open-plan ground floor — kitchen, living, and dining flow seamlessly to a private garden. Three bedrooms and two bathrooms upstairs. Double garage with direct access. Estate has pool, playground, walking trails, and 24hr security. Close to Greenstone Mall.',
  'townhouse', 'sale', 2450000, 'Unit 31 Greenstone Ridge', 'Greenstone Hill', 'Johannesburg', 'Gauteng', '1609', 3, 2, 2, 2, 160, 200, 2024, false, true, true, false, false, 'active', true, 134),

  (james_user_id, james_agent_id, 'Stylish townhouse in Lonehill',
  'Three-bedroom townhouse in a quiet Lonehill complex. Modern finishes — stone counters, porcelain tiles, LED lighting throughout. Open-plan living with gas fireplace. Private garden with covered patio. Double garage. Complex has pool and communal garden. Walking distance to Lonehill shops and close to Fourways Mall.',
  'townhouse', 'sale', 2800000, 'Unit 9 Lonehill Mews', 'Lonehill', 'Johannesburg', 'Gauteng', '2191', 3, 2, 2, 2, 175, 250, 2019, false, true, true, true, false, 'active', false, 98),

  (thandi_user_id, thandi_agent_id, 'Affordable townhouse in Midrand',
  'Two-bed townhouse perfect for a first-time buyer or young couple. Open-plan living, kitchen with breakfast bar, two bedrooms and one bathroom upstairs. Single garage and small private garden. Complex is well-maintained with pool and braai area. Close to N1 and Mall of Africa. Levies R1,800/month.',
  'townhouse', 'sale', 1250000, 'Unit 17 Garden Villas', 'Halfway House', 'Midrand', 'Gauteng', '1685', 2, 1, 1, 1, 90, 120, 2018, false, true, true, false, false, 'active', false, 57),

  (sarah_user_id, sarah_agent_id, '3-bed townhouse near OR Tambo',
  'Ideal for someone who travels a lot — 10 minutes from OR Tambo airport. Three bedrooms, one and a half bathrooms, open-plan living, single garage. Small but private garden. Secure complex with electric fencing. Close to East Rand Mall and R24 highway. Lock-up-and-go at its best.',
  'townhouse', 'sale', 1380000, 'Unit 5 Airport View', 'Jet Park', 'Boksburg', 'Gauteng', '1459', 3, 2, 1, 1, 115, 150, 2013, false, true, true, false, false, 'active', false, 41),

  (owner_user_id, NULL, 'Duplex townhouse in Randburg — Bargain',
  'Selling my 3-bed duplex — no agent commission means better price for you. Ground floor has open-plan kitchen, dining, and lounge. Three bedrooms and two bathrooms upstairs. Double garage. Private courtyard garden. Complex has pool and is well-managed. R50K below market value because I need to sell by end of March.',
  'townhouse', 'sale', 1550000, 'Unit 12 Ferndale Terrace', 'Ferndale', 'Randburg', 'Gauteng', '2194', 3, 2, 2, 2, 140, 180, 2011, false, true, true, false, false, 'active', false, 88),

  -- =====================
  -- LAND FOR SALE (3)
  -- =====================

  (james_user_id, james_agent_id, 'Prime residential stand in Midrand',
  'Level, serviced residential stand in a developing area of Midrand. Approved plans for a 4-bed house available if needed. Municipal services connected — water, electricity, sewer. Close to N1 and Mall of Africa. This area is booming and land at this price will not last. Perfect for someone who wants to build their dream home.',
  'land', 'sale', 680000, NULL, 'Halfway House', 'Midrand', 'Gauteng', '1685', NULL, NULL, NULL, NULL, NULL, 800, NULL, false, false, false, false, false, 'active', false, 89),

  (thandi_user_id, thandi_agent_id, 'Vacant land in Soweto — Zoned Residential',
  'Large vacant stand in a developing part of Soweto. Zoned residential. Flat and ready to build on. Services nearby. This is an opportunity for developers or anyone wanting to build in an up-and-coming area. Priced well below similar stands in the area.',
  'land', 'sale', 280000, NULL, 'Meadowlands', 'Soweto', 'Gauteng', '1852', NULL, NULL, NULL, NULL, NULL, 500, NULL, false, false, false, false, false, 'active', false, 34),

  (sarah_user_id, sarah_agent_id, 'Stand in Kempton Park estate',
  'Serviced stand in a new residential estate in Kempton Park. The estate will have security, fibre, and communal facilities. Building must commence within 24 months as per estate rules. Approved architects list available. Close to R21 and OR Tambo. Perfect for building a modern family home.',
  'land', 'sale', 520000, NULL, 'Glen Marais', 'Kempton Park', 'Gauteng', '1619', NULL, NULL, NULL, NULL, NULL, 600, NULL, false, false, true, false, false, 'active', false, 23),

  -- =====================
  -- HOUSES FOR RENT (8)
  -- =====================

  (sarah_user_id, sarah_agent_id, '3-bed house to rent in Boksburg',
  'Available immediately. Neat 3-bed house in central Boksburg. Lounge, dining, kitchen, two bathrooms. Single garage plus carport. Nice garden. Pet-friendly on approval. Close to schools and shops. Deposit: 2 months rent. No agents fee.',
  'house', 'rent', 12500, '76 Rose Street', 'Boksburg Central', 'Boksburg', 'Gauteng', '1459', 3, 2, 1, 2, 150, 500, 2000, false, true, true, true, false, 'active', false, 156),

  (james_user_id, james_agent_id, 'Furnished 4-bed in Sandton — Executive Rental',
  'Beautifully furnished executive home available for rent. Four bedrooms, three bathrooms, study, double garage. Pool, garden, full security. Includes all furniture, DStv, and fibre. Perfect for expats or corporate tenants. Minimum 12-month lease. Available from 1 March.',
  'house', 'rent', 25000, '5 Palm Drive', 'Sandhurst', 'Johannesburg', 'Gauteng', '2196', 4, 3, 2, 4, 320, 1000, 2010, true, true, true, false, true, 'active', true, 234),

  (thandi_user_id, thandi_agent_id, '2-bed in Soweto — Affordable rental',
  'Clean 2-bed house available to rent in Diepkloof. Recently painted, tiled floors, fitted kitchen. Outside room at the back included. Off-street parking for 2 cars. Close to Bara taxi rank and Chris Hani Baragwanath Hospital. Water included in rent.',
  'house', 'rent', 5500, '784 Tshabalala Street', 'Diepkloof', 'Soweto', 'Gauteng', '1862', 2, 1, 0, 2, 90, 300, 1990, false, false, false, false, false, 'active', false, 89),

  (sarah_user_id, sarah_agent_id, '3-bed with flatlet in Alberton — Dual income',
  'Spacious 3-bed rental with a bonus 1-bed flatlet. Main house has 3 beds, 2 baths, open-plan living, double garage. Flatlet has separate entrance. Big garden. Landlord is flexible on pets. Close to Alberton Mall. Available immediately. R16,000 for the whole property or R12,000 for main house only.',
  'house', 'rent', 16000, '44 Pine Road', 'New Redruth', 'Alberton', 'Gauteng', '1449', 3, 2, 2, 3, 200, 700, 2002, false, true, true, true, false, 'active', false, 67),

  (owner_user_id, NULL, 'Cozy 2-bed in Randburg — No agent fees',
  'I am renting out my Randburg home while I work overseas for 2 years. Neat 2-bed, 1-bath with lounge, kitchen, and single garage. Small garden. Pet-friendly. I prefer a responsible long-term tenant. No agent fees — deal directly with me. Available from 1 February.',
  'house', 'rent', 9500, '11 Cedar Lane', 'Randpark Ridge', 'Randburg', 'Gauteng', '2169', 2, 1, 1, 2, 100, 450, 1998, false, true, false, true, false, 'active', false, 112),

  (james_user_id, james_agent_id, 'Family home to rent in Fourways',
  'Large family home in a secure estate. Four bedrooms, three bathrooms, study, double garage, pool. The kids can ride their bikes on the estate roads safely. Estate has playground and walking trails. Close to Fourways Mall and good schools. Minimum 12-month lease. Available immediately.',
  'house', 'rent', 22000, '33 Falcon Ridge', 'Fourways Gardens', 'Johannesburg', 'Gauteng', '2191', 4, 3, 2, 4, 300, 800, 2014, true, true, true, true, false, 'active', false, 145),

  (sarah_user_id, sarah_agent_id, 'Cottage to rent in Benoni — R6,500',
  'Self-contained cottage on a large property. One bedroom, one bathroom, kitchenette, and living area. Prepaid electricity. Water included. Off-street parking. Quiet area. Suitable for a single person or couple. No pets. Available immediately.',
  'house', 'rent', 6500, '19 Botes Street', 'Northmead', 'Benoni', 'Gauteng', '1501', 1, 1, 0, 1, 45, NULL, 1985, false, false, false, false, false, 'active', false, 78),

  (thandi_user_id, thandi_agent_id, '3-bed rental in Centurion — Good schools nearby',
  'Well-maintained 3-bed, 2-bath home in a quiet Centurion street. Open-plan living, modern kitchen, double garage. Nice garden with covered patio and braai. In the catchment area for Centurion High and Zwartkop Primary. Close to Centurion Mall and Gautrain. Prepaid electricity.',
  'house', 'rent', 14500, '9 Marais Street', 'Centurion Central', 'Centurion', 'Gauteng', '0157', 3, 2, 2, 3, 180, 600, 2006, false, true, true, false, false, 'active', false, 52),

  -- =====================
  -- APARTMENTS FOR RENT (5)
  -- =====================

  (james_user_id, james_agent_id, 'Modern 1-bed in Sandton — Walk to Gautrain',
  'Sleek 1-bed apartment in a new Sandton building. Open-plan with modern kitchen, built-in cupboards, and balcony. One parking bay. Fibre included. Building has gym, pool, and concierge. Literally a 5-minute walk to the Sandton Gautrain station. Ideal for a young professional.',
  'apartment', 'rent', 11500, 'Unit 706 Sandton Skye', 'Sandton', 'Johannesburg', 'Gauteng', '2196', 1, 1, 0, 1, 50, NULL, 2023, false, false, true, false, false, 'active', false, 189),

  (sarah_user_id, sarah_agent_id, '2-bed apartment in Boksburg',
  'Spacious 2-bed apartment in a secure complex. Open-plan living, kitchen with stove and oven, two bedrooms with built-ins. One bathroom. One covered parking bay. Complex pool and braai area. Close to Boksburg Lake and East Rand Mall. Water included in levy.',
  'apartment', 'rent', 7500, 'Unit 15 Lake View Complex', 'Boksburg', 'Boksburg', 'Gauteng', '1459', 2, 1, 0, 1, 68, NULL, 2012, false, false, true, false, false, 'active', false, 67),

  (thandi_user_id, thandi_agent_id, 'Bachelor flat in Midrand — R5,000',
  'Compact bachelor flat in Midrand. Open-plan with kitchenette and bathroom. Prepaid electricity. Water included. Secure complex with access control. One open parking bay. Close to N1 and Mall of Africa. Perfect for a student or single person on a budget.',
  'apartment', 'rent', 5000, 'Unit 103 Midrand Place', 'Halfway House', 'Midrand', 'Gauteng', '1685', 0, 1, 0, 1, 30, NULL, 2018, false, false, true, false, false, 'active', false, 43),

  (james_user_id, james_agent_id, 'Luxury 2-bed in Rosebank — Fully furnished',
  'Tastefully furnished 2-bed apartment in Rosebank. Modern kitchen, two bedrooms both en-suite, open-plan living with balcony views. Two parking bays. Building has rooftop bar, gym, pool, and concierge. All-inclusive: WiFi, DStv, and cleaning twice a week. Short-term leases from 3 months considered.',
  'apartment', 'rent', 18000, 'Unit 1102 The Tyrwhitt', 'Rosebank', 'Johannesburg', 'Gauteng', '2196', 2, 2, 0, 2, 85, NULL, 2022, false, false, true, false, true, 'active', false, 267),

  (owner_user_id, NULL, '1-bed in Centurion — No agent commission',
  'Renting my apartment directly — no agent fees. Clean 1-bed with open-plan living and kitchen. Built-in cupboards, full bathroom, one parking bay. Complex has pool and security. Close to Centurion Mall and Gautrain. Available immediately. R6,500/month including water and building levy.',
  'apartment', 'rent', 6500, 'Unit 205 Centurion Gate', 'Centurion Central', 'Centurion', 'Gauteng', '0157', 1, 1, 0, 1, 52, NULL, 2015, false, false, true, false, false, 'active', false, 94),

  -- =====================
  -- TOWNHOUSE FOR RENT (2)
  -- =====================

  (sarah_user_id, sarah_agent_id, '3-bed townhouse to rent in Greenstone',
  'Stunning 3-bed townhouse available in Greenstone Hill estate. Modern finishes, open-plan ground floor, double garage. Private garden with covered patio. Estate has pool, gym, playground, and 24hr security. Close to Greenstone Shopping Centre. Available from 1 March. Minimum 12-month lease.',
  'townhouse', 'rent', 15000, 'Unit 22 Stone Creek', 'Greenstone Hill', 'Johannesburg', 'Gauteng', '1609', 3, 2, 2, 2, 155, 190, 2021, false, true, true, false, false, 'active', false, 78),

  (james_user_id, james_agent_id, '2-bed townhouse in Fourways — Pet friendly',
  'Modern 2-bed townhouse in a secure complex. Open-plan living, kitchen with breakfast bar. Two bedrooms and one bathroom upstairs. Single garage and small garden. Complex allows one pet on approval. Close to Fourways Mall and Monte Casino. Available immediately.',
  'townhouse', 'rent', 12000, 'Unit 8 Willow Creek', 'Fourways', 'Johannesburg', 'Gauteng', '2191', 2, 1, 1, 1, 90, 120, 2019, false, true, true, true, false, 'active', false, 56),

  -- =====================
  -- COMMERCIAL (2)
  -- =====================

  (james_user_id, james_agent_id, 'Office space in Sandton — 200sqm',
  'Prime A-grade office space available in Sandton CBD. Open-plan with partitioned boardroom and two offices. Kitchenette and two bathrooms. Fibre-ready. Three dedicated parking bays. Building has reception, security, and backup generator. Walking distance to Sandton City and Gautrain. Gross rental — no hidden costs.',
  'commercial', 'rent', 35000, '4th Floor, Sandton Towers', 'Sandton', 'Johannesburg', 'Gauteng', '2196', NULL, 2, NULL, 3, 200, NULL, 2015, false, false, true, false, false, 'active', false, 45),

  (sarah_user_id, sarah_agent_id, 'Retail space in Kempton Park — High foot traffic',
  'Ground-floor retail space in busy Kempton Park location. 80sqm with shop front, back office, and bathroom. High visibility on main road. Existing signage infrastructure. Suitable for salon, takeaway, or small retail shop. Close to Kempton Park Station. Available immediately.',
  'commercial', 'rent', 12000, '123 Central Avenue', 'Kempton Park', 'Kempton Park', 'Gauteng', '1619', NULL, 1, NULL, 2, 80, NULL, 2008, false, false, true, false, false, 'active', false, 28);

END;
$$;

COMMIT;
