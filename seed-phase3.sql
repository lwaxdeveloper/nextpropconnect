-- Phase 3 Seed Data: Agent users, leads, templates, activities

-- Create agent users (skip if email already exists)
DO $$
DECLARE
  mike_id INTEGER;
  sarah_id INTEGER;
  mike_profile_id INTEGER;
  sarah_profile_id INTEGER;
  prop_ids INTEGER[];
  lead_id INTEGER;
BEGIN
  -- Agent 1: Mike Patel
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'mike@propconnect.co.za') THEN
    INSERT INTO users (name, email, phone, password_hash, role)
    VALUES ('Mike Patel', 'mike@propconnect.co.za', '+27 82 555 0101',
      '$2a$12$7P.zF91EauaxcZnZGmkyGuWXAeNLk7iS2FpL8QjPzPyogbwWT8lzq',  -- Agent2026!
      'agent')
    RETURNING id INTO mike_id;
  ELSE
    SELECT id INTO mike_id FROM users WHERE email = 'mike@propconnect.co.za';
  END IF;

  -- Agent 2: Sarah Mokwena
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'sarah@propconnect.co.za') THEN
    INSERT INTO users (name, email, phone, password_hash, role)
    VALUES ('Sarah Mokwena', 'sarah@propconnect.co.za', '+27 83 555 0202',
      '$2a$12$7P.zF91EauaxcZnZGmkyGuWXAeNLk7iS2FpL8QjPzPyogbwWT8lzq',  -- Agent2026!
      'agent')
    RETURNING id INTO sarah_id;
  ELSE
    SELECT id INTO sarah_id FROM users WHERE email = 'sarah@propconnect.co.za';
  END IF;

  -- Agent profiles
  IF NOT EXISTS (SELECT 1 FROM agent_profiles WHERE user_id = mike_id) THEN
    INSERT INTO agent_profiles (user_id, agency_name, bio, areas_served, specializations, years_experience, commission_rate, eaab_number, ffc_number, is_verified, trust_score, show_phone, enable_whatsapp)
    VALUES (mike_id, 'Patel Properties', 'Experienced agent specializing in the East Rand. Over 10 years helping families find their dream homes in Boksburg and Benoni.',
      ARRAY['Boksburg', 'Benoni', 'Kempton Park', 'Edenvale'],
      ARRAY['Residential Sales', 'First-time Buyers', 'Investment Properties'],
      10, 5.50, 'EAAB78901', 'FFC2026/078', true, 85, true, true)
    RETURNING id INTO mike_profile_id;
  ELSE
    SELECT id INTO mike_profile_id FROM agent_profiles WHERE user_id = mike_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agent_profiles WHERE user_id = sarah_id) THEN
    INSERT INTO agent_profiles (user_id, agency_name, bio, areas_served, specializations, years_experience, commission_rate, eaab_number, ffc_number, is_verified, trust_score, show_phone, enable_whatsapp)
    VALUES (sarah_id, 'Mokwena Realty', 'Top-performing Sandton and Midrand agent. Specialist in luxury homes and sectional title units. Let me help you invest wisely.',
      ARRAY['Sandton', 'Midrand', 'Fourways', 'Bryanston'],
      ARRAY['Residential Sales', 'Luxury', 'Sectional Title', 'Off-plan'],
      7, 6.00, 'EAAB45678', 'FFC2026/045', true, 90, true, true)
    RETURNING id INTO sarah_profile_id;
  ELSE
    SELECT id INTO sarah_profile_id FROM agent_profiles WHERE user_id = sarah_id;
  END IF;

  -- Assign some existing properties to agents
  UPDATE properties SET user_id = mike_id WHERE id IN (SELECT id FROM properties WHERE user_id != mike_id AND user_id != sarah_id ORDER BY id LIMIT 12);
  UPDATE properties SET user_id = sarah_id WHERE id IN (SELECT id FROM properties WHERE user_id != mike_id AND user_id != sarah_id ORDER BY id LIMIT 12);

  -- Get some property IDs for leads
  SELECT ARRAY_AGG(id) INTO prop_ids FROM (SELECT id FROM properties WHERE user_id = mike_id LIMIT 5) sub;

  -- ====== LEADS FOR MIKE ======
  INSERT INTO leads (agent_id, contact_name, contact_email, contact_phone, property_id, source, status, priority, budget, notes, follow_up_date, created_at) VALUES
    (mike_id, 'Thabo Molefe', 'thabo.m@gmail.com', '+27 72 100 2001', prop_ids[1], 'propconnect', 'new', 'hot', 1200000, 'Interested in 3-bedroom. Pre-approved for bond.', CURRENT_DATE + 2, NOW() - INTERVAL '1 day'),
    (mike_id, 'Linda van der Merwe', 'linda.vdm@outlook.com', '+27 83 200 3001', prop_ids[2], 'whatsapp', 'contacted', 'hot', 1800000, 'Looking to relocate from Cape Town. Needs 4 bedrooms.', CURRENT_DATE + 3, NOW() - INTERVAL '3 days'),
    (mike_id, 'Sipho Nkosi', NULL, '+27 71 300 4001', prop_ids[3], 'referral', 'viewing_done', 'medium', 950000, 'Referred by Thabo. First-time buyer. Liked the garden.', CURRENT_DATE + 5, NOW() - INTERVAL '7 days'),
    (mike_id, 'James O''Brien', 'james.ob@gmail.com', '+27 82 400 5001', prop_ids[1], 'propconnect', 'negotiating', 'hot', 1350000, 'Offering below asking. Seller considering.', CURRENT_DATE + 1, NOW() - INTERVAL '10 days'),
    (mike_id, 'Nomsa Dlamini', 'nomsa.d@yahoo.com', '+27 84 500 6001', NULL, 'walk_in', 'new', 'medium', 800000, 'Walk-in at office. Looking for 2-bed apartment in Boksburg.', CURRENT_DATE + 7, NOW() - INTERVAL '2 days'),
    (mike_id, 'Pieter Botha', 'pieter.b@gmail.com', '+27 76 600 7001', prop_ids[2], 'propconnect', 'contacted', 'cold', 2000000, 'Just browsing. Not urgent. Investment property.', CURRENT_DATE + 14, NOW() - INTERVAL '5 days'),
    (mike_id, 'Zanele Khumalo', NULL, '+27 73 700 8001', prop_ids[4], 'whatsapp', 'offer', 'hot', 1500000, 'Formal offer submitted. Awaiting seller response.', CURRENT_DATE, NOW() - INTERVAL '14 days'),
    (mike_id, 'Robert Smith', 'rob.smith@email.com', '+27 81 800 9001', prop_ids[3], 'propconnect', 'viewing_done', 'medium', 1100000, 'Viewed last Saturday. Wants to bring wife for second viewing.', CURRENT_DATE + 4, NOW() - INTERVAL '8 days'),
    (mike_id, 'Ayanda Mbeki', 'ayanda.m@gmail.com', '+27 79 900 1001', NULL, 'referral', 'won', 'hot', 1650000, 'Deal closed! Bond approved. Transfer in progress.', NULL, NOW() - INTERVAL '30 days'),
    (mike_id, 'Chloe Williams', 'chloe.w@outlook.com', '+27 82 100 2002', prop_ids[5], 'propconnect', 'lost', 'medium', 900000, 'Went with another agent. Price was too high.', NULL, NOW() - INTERVAL '20 days'),
    (mike_id, 'David Naidoo', NULL, '+27 74 200 3002', NULL, 'walk_in', 'new', 'cold', 600000, 'Student looking for affordable rental. Referred to rentals.', CURRENT_DATE + 10, NOW() - INTERVAL '1 day'),
    (mike_id, 'Fatima Hassan', 'fatima.h@gmail.com', '+27 83 300 4002', prop_ids[1], 'whatsapp', 'contacted', 'medium', 1400000, 'Relocating from Durban. Needs to sell current home first.', CURRENT_DATE + 7, NOW() - INTERVAL '6 days');

  -- Add activities for Mike's leads
  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'status_change', 'Lead created with status: new', l.created_at
  FROM leads l WHERE l.agent_id = mike_id;

  -- Extra activities for specific leads
  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'call', 'Called to introduce myself. Very interested, wants viewing ASAP.', l.created_at + INTERVAL '1 hour'
  FROM leads l WHERE l.agent_id = mike_id AND l.contact_name = 'Linda van der Merwe';

  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'viewing', 'Showed the property. Client loved it. Bringing wife next weekend.', l.created_at + INTERVAL '3 days'
  FROM leads l WHERE l.agent_id = mike_id AND l.contact_name = 'Sipho Nkosi';

  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'offer', 'Offer of R1.3M submitted. Below asking by R200K.', l.created_at + INTERVAL '5 days'
  FROM leads l WHERE l.agent_id = mike_id AND l.contact_name = 'James O''Brien';

  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'note', 'Bond pre-approval received from FNB. R1.5M approved.', l.created_at + INTERVAL '2 days'
  FROM leads l WHERE l.agent_id = mike_id AND l.contact_name = 'Zanele Khumalo';

  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'status_change', 'Deal closed! Transfer attorneys appointed.', l.created_at + INTERVAL '20 days'
  FROM leads l WHERE l.agent_id = mike_id AND l.contact_name = 'Ayanda Mbeki';

  -- ====== LEADS FOR SARAH ======
  SELECT ARRAY_AGG(id) INTO prop_ids FROM (SELECT id FROM properties WHERE user_id = sarah_id LIMIT 5) sub;

  INSERT INTO leads (agent_id, contact_name, contact_email, contact_phone, property_id, source, status, priority, budget, notes, follow_up_date, created_at) VALUES
    (sarah_id, 'Michael Chen', 'michael.chen@corp.com', '+27 82 111 2111', prop_ids[1], 'propconnect', 'new', 'hot', 3500000, 'Looking for luxury apartment in Sandton. Cash buyer.', CURRENT_DATE + 1, NOW() - INTERVAL '2 days'),
    (sarah_id, 'Priya Naidoo', 'priya.n@gmail.com', '+27 79 222 3111', prop_ids[2], 'referral', 'contacted', 'hot', 2800000, 'Referred by Michael Chen. Wants Midrand cluster.', CURRENT_DATE + 3, NOW() - INTERVAL '4 days'),
    (sarah_id, 'John Vorster', 'john.v@outlook.com', '+27 83 333 4111', NULL, 'walk_in', 'viewing_done', 'medium', 2200000, 'Viewed 3 properties. Likes Fourways area.', CURRENT_DATE + 5, NOW() - INTERVAL '9 days'),
    (sarah_id, 'Grace Moyo', NULL, '+27 71 444 5111', prop_ids[3], 'whatsapp', 'negotiating', 'hot', 4000000, 'Counter-offer sent. Close to agreement.', CURRENT_DATE + 1, NOW() - INTERVAL '12 days'),
    (sarah_id, 'André du Plessis', 'andre.dp@email.com', '+27 76 555 6111', prop_ids[4], 'propconnect', 'new', 'medium', 1800000, 'Investment buyer. Wants rental yield analysis.', CURRENT_DATE + 7, NOW() - INTERVAL '1 day'),
    (sarah_id, 'Lerato Phiri', 'lerato.p@gmail.com', '+27 84 666 7111', prop_ids[2], 'propconnect', 'contacted', 'cold', 1500000, 'Browsing. Might buy end of year.', CURRENT_DATE + 21, NOW() - INTERVAL '6 days'),
    (sarah_id, 'Sophie van Wyk', NULL, '+27 73 777 8111', prop_ids[5], 'whatsapp', 'offer', 'hot', 3200000, 'Offer accepted! Waiting for bond approval.', NULL, NOW() - INTERVAL '18 days'),
    (sarah_id, 'Kagiso Moloi', 'kagiso.m@corp.com', '+27 81 888 9111', NULL, 'referral', 'viewing_done', 'medium', 2500000, 'Viewed Bryanston property. Wants bigger garden.', CURRENT_DATE + 3, NOW() - INTERVAL '11 days'),
    (sarah_id, 'Emma Thompson', 'emma.t@outlook.com', '+27 82 999 0111', prop_ids[1], 'propconnect', 'won', 'hot', 3800000, 'Sale complete. Commission paid. Happy client!', NULL, NOW() - INTERVAL '45 days'),
    (sarah_id, 'Tshepo Mabaso', NULL, '+27 79 100 1112', NULL, 'walk_in', 'lost', 'cold', 1200000, 'Budget too low for Sandton. Referred to colleague in Midrand.', NULL, NOW() - INTERVAL '25 days'),
    (sarah_id, 'Rachel Kim', 'rachel.k@gmail.com', '+27 83 200 2112', prop_ids[3], 'propconnect', 'contacted', 'medium', 2600000, 'Expat relocating from Seoul. Needs furnished option.', CURRENT_DATE + 5, NOW() - INTERVAL '3 days'),
    (sarah_id, 'Ben Okafor', 'ben.o@corp.com', '+27 74 300 3112', prop_ids[4], 'whatsapp', 'new', 'hot', 5000000, 'Nigerian executive. Cash buyer. Wants Sandton penthouse.', CURRENT_DATE + 2, NOW() - INTERVAL '1 day'),
    (sarah_id, 'Nosipho Zulu', 'nosipho.z@gmail.com', '+27 71 400 4112', NULL, 'referral', 'negotiating', 'medium', 1900000, 'Negotiating on Midrand townhouse. Close to deal.', CURRENT_DATE + 2, NOW() - INTERVAL '15 days');

  -- Activities for Sarah's leads
  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'status_change', 'Lead created with status: new', l.created_at
  FROM leads l WHERE l.agent_id = sarah_id;

  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'call', 'Introductory call. Cash buyer, very motivated. Showing Sandton apartments tomorrow.', l.created_at + INTERVAL '2 hours'
  FROM leads l WHERE l.agent_id = sarah_id AND l.contact_name = 'Michael Chen';

  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'offer', 'Offer of R3.1M submitted and accepted! Bond application in progress.', l.created_at + INTERVAL '10 days'
  FROM leads l WHERE l.agent_id = sarah_id AND l.contact_name = 'Sophie van Wyk';

  INSERT INTO lead_activities (lead_id, activity_type, description, created_at)
  SELECT l.id, 'whatsapp', 'Counter-offer sent via WhatsApp: R3.85M. Seller considering.', l.created_at + INTERVAL '7 days'
  FROM leads l WHERE l.agent_id = sarah_id AND l.contact_name = 'Grace Moyo';

  -- ====== QUICK REPLY TEMPLATES ======
  -- For Mike
  INSERT INTO quick_replies (agent_id, title, content, category, usage_count) VALUES
    (mike_id, 'Initial Interest', 'Hi {buyer_name}! Thanks for your interest in {property_name}. The property is still available. Would you like to schedule a viewing?', 'general', 24),
    (mike_id, 'Viewing Invite', 'Great news! I have a viewing slot available this Saturday at 10:00. Shall I book you in?', 'viewing', 18),
    (mike_id, 'Price Discussion', 'The asking price is {price}, but the seller is open to reasonable offers. Would you like to discuss?', 'price', 12),
    (mike_id, 'Bond Documents', 'For the bond application, you''ll need: ID copy, 3 months payslips, 3 months bank statements. Shall I connect you with our bond originator?', 'documents', 8),
    (mike_id, 'Post-Viewing Follow-up', 'Thank you for viewing {property_name}! What did you think? Would you like to make an offer?', 'viewing', 15);

  -- For Sarah
  INSERT INTO quick_replies (agent_id, title, content, category, usage_count) VALUES
    (sarah_id, 'Initial Interest', 'Hi {buyer_name}! Thanks for your interest in {property_name}. The property is still available. Would you like to schedule a viewing?', 'general', 31),
    (sarah_id, 'Viewing Invite', 'Great news! I have a viewing slot available this Saturday at 10:00. Shall I book you in?', 'viewing', 22),
    (sarah_id, 'Price Discussion', 'The asking price is {price}, but the seller is open to reasonable offers. Would you like to discuss?', 'price', 16),
    (sarah_id, 'Bond Documents', 'For the bond application, you''ll need: ID copy, 3 months payslips, 3 months bank statements. Shall I connect you with our bond originator?', 'documents', 10),
    (sarah_id, 'Post-Viewing Follow-up', 'Thank you for viewing {property_name}! What did you think? Would you like to make an offer?', 'viewing', 19);

  RAISE NOTICE 'Phase 3 seed data created. Mike ID: %, Sarah ID: %', mike_id, sarah_id;
END $$;
