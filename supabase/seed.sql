/*
  # Add test data with random UUIDs

  1. Test Data Setup
    - Creates test user and moderator with random UUID
    - Creates sample events with different statuses
    - Creates sample rentals with different types
    
  2. Data Structure
    - All IDs use gen_random_uuid() for true randomness
    - Maintains relationships between entities using variables
*/

DO $$
DECLARE
  moderator_id uuid;
BEGIN
  -- Create test user and store ID
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    gen_random_uuid(),
    'testmod@example.com',
    crypt('testmod123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    ''
  )
  RETURNING id INTO moderator_id;

  -- Create moderator profile
  INSERT INTO profiles (id, full_name, telegram_username, role)
  VALUES (
    moderator_id,
    'Test Moderator',
    'testmod',
    'moderator'
  );

  -- Create test events
  INSERT INTO events (
    id,
    creator_id,
    title,
    description,
    category,
    date,
    location,
    max_attendees,
    rsvp_deadline,
    is_paid,
    telegram_contact,
    images,
    status,
    moderator_id
  ) VALUES 
  (
    gen_random_uuid(),
    moderator_id,
    'Surfing at Porto da Cruz',
    'Join us for an amazing surfing session at Porto da Cruz! Perfect for beginners and intermediate surfers.\n\n- Equipment provided\n- Professional instructor\n- Beach snacks included',
    'Sports',
    NOW() + INTERVAL '7 days',
    'Porto da Cruz Beach',
    10,
    NOW() + INTERVAL '5 days',
    true,
    '@surfmadeira',
    ARRAY['https://images.unsplash.com/photo-1502680390469-be75c86b636f'],
    'published',
    moderator_id
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'Hiking Pico do Arieiro',
    'Early morning hike to watch the sunrise from Madeira''s third highest peak.\n\n- Transportation included\n- Breakfast provided\n- Professional guide',
    'Hiking',
    NOW() + INTERVAL '14 days',
    'Pico do Arieiro',
    15,
    NOW() + INTERVAL '10 days',
    true,
    '@hikemadeira',
    ARRAY['https://images.unsplash.com/photo-1613664161831-35ca95a4b953'],
    'draft',
    null
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'Sunset Yoga Class',
    'Relaxing yoga session with ocean views.\n\n- All levels welcome\n- Mats provided\n- Meditation included',
    'Wellness',
    NOW() + INTERVAL '5 days',
    'Ponta do Sol',
    8,
    NOW() + INTERVAL '3 days',
    false,
    '@yogamadeira',
    ARRAY['https://images.unsplash.com/photo-1506126613408-eca07ce68773'],
    'pending',
    null
  );

  -- Create test rentals
  INSERT INTO rentals (
    id,
    creator_id,
    title,
    description,
    type,
    location,
    price_per_day,
    min_duration,
    max_duration,
    security_deposit,
    telegram_contact,
    images,
    status,
    moderator_id
  ) VALUES 
  (
    gen_random_uuid(),
    moderator_id,
    'Modern Flat in Funchal',
    'Beautiful 2-bedroom apartment in the heart of Funchal.\n\n- Ocean view\n- Fully equipped kitchen\n- Fast WiFi\n- Close to restaurants and shops',
    'flat',
    'Funchal',
    75,
    3,
    30,
    500,
    '@rentmadeira',
    ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    'published',
    moderator_id
  ),
  (
    gen_random_uuid(),
    moderator_id,
    '125cc Scooter',
    'Perfect scooter for exploring the island.\n\n- Helmet included\n- Insurance included\n- Free delivery\n- 24/7 support',
    'scooter',
    'Funchal',
    25,
    1,
    14,
    200,
    '@scootermadeira',
    ARRAY['https://images.unsplash.com/photo-1494976388531-d1058494cdd8'],
    'published',
    moderator_id
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'Villa in Ponta do Sol',
    'Stunning villa with private pool and garden.\n\n- 3 bedrooms\n- Sea view\n- Private parking\n- BBQ area',
    'house',
    'Ponta do Sol',
    150,
    5,
    90,
    1000,
    '@villamadeira',
    ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914'],
    'draft',
    null
  );
END $$;

/*
  # Add more test events and rentals

  1. Test Data Expansion
    - Adds more diverse events across different categories
    - Adds more rental options across all rental types
    - Uses the existing moderator account
    
  2. Data Variety
    - Events with different statuses, prices, and capacities
    - Rentals covering all types: flat, house, scooter, motorbike, car
*/

DO $$
DECLARE
  moderator_id uuid;
BEGIN
  -- Get existing moderator ID
  SELECT id INTO moderator_id FROM profiles WHERE role = 'moderator' LIMIT 1;

  -- Add more events
  INSERT INTO events (
    id,
    creator_id,
    title,
    description,
    category,
    date,
    location,
    max_attendees,
    rsvp_deadline,
    is_paid,
    telegram_contact,
    images,
    status,
    moderator_id
  ) VALUES 
  (
    gen_random_uuid(),
    moderator_id,
    'Wine Tasting Experience',
    'Discover Madeira''s famous wines with our expert sommelier.\n\n- 5 different Madeira wines\n- Local cheese pairing\n- History and production insights\n- Take home a bottle',
    'Food & Drink',
    NOW() + INTERVAL '10 days',
    'Blandy''s Wine Lodge, Funchal',
    12,
    NOW() + INTERVAL '8 days',
    true,
    '@madeirawine',
    ARRAY['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3'],
    'published',
    moderator_id
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'Photography Workshop',
    'Capture Madeira''s stunning landscapes.\n\n- Camera basics\n- Composition techniques\n- Best photo locations\n- Post-processing tips',
    'Education',
    NOW() + INTERVAL '15 days',
    'Ponta de São Lourenço',
    8,
    NOW() + INTERVAL '12 days',
    true,
    '@photosmadeira',
    ARRAY['https://images.unsplash.com/photo-1452587925148-ce544e77e70d'],
    'published',
    moderator_id
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'Levada Walk Guide',
    'Explore the beautiful Levada do Caldeirão Verde.\n\n- Professional guide\n- Safety equipment\n- Picnic lunch\n- Transport included',
    'Hiking',
    NOW() + INTERVAL '20 days',
    'Santana',
    20,
    NOW() + INTERVAL '15 days',
    true,
    '@levadaguide',
    ARRAY['https://images.unsplash.com/photo-1551632811-561732d1e306'],
    'pending',
    null
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'Dolphin Watching',
    'Spot dolphins and whales in their natural habitat.\n\n- 3-hour boat trip\n- Marine biologist guide\n- Snacks and drinks\n- Swimming stop',
    'Nature',
    NOW() + INTERVAL '12 days',
    'Marina do Funchal',
    30,
    NOW() + INTERVAL '9 days',
    true,
    '@oceantours',
    ARRAY['https://images.unsplash.com/photo-1607153333879-c174d265f1d2'],
    'published',
    moderator_id
  );

  -- Add more rentals
  INSERT INTO rentals (
    id,
    creator_id,
    title,
    description,
    type,
    location,
    price_per_day,
    min_duration,
    max_duration,
    security_deposit,
    telegram_contact,
    images,
    status,
    moderator_id
  ) VALUES 
  (
    gen_random_uuid(),
    moderator_id,
    'Luxury Penthouse with Ocean View',
    'Stunning penthouse in the heart of Funchal.\n\n- 3 bedrooms\n- Private terrace\n- Infinity pool\n- Gym access\n- Parking included',
    'flat',
    'Funchal',
    200,
    2,
    90,
    1000,
    '@luxurymadeira',
    ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
    'published',
    moderator_id
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'Mountain Villa with Pool',
    'Traditional stone house with modern amenities.\n\n- 4 bedrooms\n- Private pool\n- Mountain views\n- Garden with BBQ\n- Wine cellar',
    'house',
    'Jardim da Serra',
    300,
    7,
    180,
    2000,
    '@villasmadeira',
    ARRAY['https://images.unsplash.com/photo-1518780664697-55e3ad937233'],
    'published',
    moderator_id
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'Vespa 125cc',
    'Classic Italian style scooter.\n\n- Perfect for couples\n- Fuel efficient\n- Easy to park\n- Insurance included',
    'scooter',
    'Funchal',
    30,
    1,
    30,
    300,
    '@vesparental',
    ARRAY['https://images.unsplash.com/photo-1621972750749-0fbb1abb7736'],
    'published',
    moderator_id
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'BMW R1250GS Adventure',
    'Premium adventure motorcycle.\n\n- Perfect for island touring\n- Panniers included\n- GPS navigation\n- Comprehensive insurance',
    'motorbike',
    'Funchal',
    100,
    2,
    14,
    1000,
    '@motorent',
    ARRAY['https://images.unsplash.com/photo-1558981285-6f0c94958bb6'],
    'published',
    moderator_id
  ),
  (
    gen_random_uuid(),
    moderator_id,
    'Tesla Model 3',
    'Electric luxury sedan.\n\n- Autopilot\n- Free supercharging\n- Premium sound\n- All insurance included',
    'car',
    'Funchal Airport',
    150,
    2,
    30,
    1500,
    '@teslarental',
    ARRAY['https://images.unsplash.com/photo-1536700503339-1e4b06520771'],
    'published',
    moderator_id
  );
END $$;
