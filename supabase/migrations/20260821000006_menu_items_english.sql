-- Soporte multilingüe (ES/EN) para el módulo de pedidos. Columnas opcionales
-- de traducción: si están vacías, el cliente ve el nombre/descripción en
-- español (fallback), así el admin puede seguir agregando platos sin
-- traducirlos de inmediato.
alter table public.menu_items
  add column nombre_en text,
  add column descripcion_en text;

update public.menu_items as m set
  nombre_en = v.nombre_en,
  descripcion_en = v.descripcion_en
from (values
  ('94278403-22d0-42e7-8076-4471bc8ac582', 'Steak a lo Pobre', 'Pan-fried fillet served with rice, a fried egg, sausage, fried plantains and crispy French fries.'),
  ('b845217d-313c-49eb-8e9a-d33a416d1783', 'Fish a lo Pobre', 'Pan-fried fillet served with rice, a fried egg, sausage, fried plantains and crispy French fries.'),
  ('41adc2b5-4b6b-4fe2-a361-37cad6817101', 'Chicken a lo Pobre', 'Pan-fried fillet served with rice, a fried egg, sausage, fried plantains and crispy French fries.'),

  ('e96fad29-319a-42c0-b311-78e77cd0855d', 'White Rice', null),
  ('9fd90683-5b29-44e5-b375-67395ae3eccb', 'Boiled Sweet Potato', null),
  ('cb6a3810-d363-4680-8a45-db308050c007', 'Fresh Salad', null),
  ('5f86b57e-a0ef-4b92-a1bd-f7a2e6e46f54', 'French Fries', null),
  ('b4b32152-8192-45c5-8220-30f5db130f45', 'Fried Plantains', null),

  ('d6f4dba1-1871-4768-b9be-1ee726ab7c42', 'Mineral Water 2L', null),
  ('1d6e3759-26e0-4072-ac1d-eaf8a348b627', 'Mineral Water 500ml', null),

  ('322805eb-faf6-4386-84e6-938804579e62', 'Steak Chaufa (Fried Rice)', 'Wok-fried rice with egg, scallions, spices and that classic Chinese-Peruvian flavor.'),
  ('2671a1e6-b039-420a-aca5-b39da54f007f', 'Shrimp Chaufa (Fried Rice)', 'Wok-fried rice with egg, scallions, spices and that classic Chinese-Peruvian flavor.'),
  ('15a57622-09c6-4b0b-a637-4b97465019ba', 'Seafood Chaufa (Fried Rice)', 'Wok-fried rice with egg, scallions, spices and that classic Chinese-Peruvian flavor.'),
  ('0c97b4d6-70f7-4958-82a4-c41d57a65d0e', 'Fish Chaufa (Fried Rice)', 'Wok-fried rice with egg, scallions, spices and that classic Chinese-Peruvian flavor.'),
  ('a0d87027-3510-4d16-af50-b1bc2b8e45a3', 'Chicken Chaufa (Fried Rice)', 'Wok-fried rice with egg, scallions, spices and that classic Chinese-Peruvian flavor.'),
  ('290fc246-caee-4241-a2e9-4e373e991bdc', 'Vegetable Chaufa (Fried Rice)', 'Wok-fried rice with egg, scallions, spices and that classic Chinese-Peruvian flavor.'),

  ('31a61638-7076-4631-83f5-632f6d014896', 'Ajos y Olas (Garlic Fish)', 'Fried fish fillet topped with a rich garlic sauce, served with white rice and golden potatoes.'),
  ('9be5d869-961e-41ce-881b-11251b567c9a', 'Pescado Marinero (Seafood Sauce Fish)', 'Fried fish fillet topped with a special seafood sauce, served with white rice and golden potatoes.'),

  ('ff05d3bc-38c1-4ab9-aa9c-e95f506145aa', 'Fried Steak', 'Soft, fresh fillet, pan-fried, served with white rice and crispy French fries.'),
  ('f8c00430-5835-494a-af99-37269a4fa0a8', 'Beef or Pork Chop', 'Soft, fresh fillet, pan-fried, served with white rice and crispy French fries.'),
  ('92acc320-392e-4653-bbdc-20296c277268', 'Fried Fish Fillet', 'Soft, fresh fillet, pan-fried, served with white rice and crispy French fries.'),
  ('7f9fd2a2-5766-4c2e-85ab-bd30b59fb10f', 'Fried Chicken Fillet', 'Soft, fresh fillet, pan-fried, served with white rice and crispy French fries.'),

  ('6f60a822-6a5a-41c0-b38a-3d956f82f631', 'Beef Stir-Fry (Lomo Saltado)', 'Flame-seared chunks with vegetables and a touch of soy sauce, served with white rice and crispy French fries.'),
  ('3272a047-ebff-4983-b93b-a9fe3b1da13b', 'Shrimp Stir-Fry', 'Flame-seared chunks with vegetables and a touch of soy sauce, served with white rice and crispy French fries.'),
  ('6009efd5-0f10-431d-b832-a3970c41e4be', 'Fish Stir-Fry', 'Flame-seared chunks with vegetables and a touch of soy sauce, served with white rice and crispy French fries.'),
  ('63ffdf44-4983-4e89-af9a-6990af520dbe', 'Chicken Stir-Fry', 'Flame-seared chunks with vegetables and a touch of soy sauce, served with white rice and crispy French fries.'),
  ('52faf960-bd40-48db-93fd-529221e5d1e4', 'Vegetable Stir-Fry', 'Flame-seared chunks with vegetables and a touch of soy sauce, served with white rice and crispy French fries.'),

  ('5528be99-919d-45aa-9fa7-f92955d09d96', 'Fish Milanesa (Breaded Fillet)', 'Breaded, fried fillet served with white rice, French fries and fresh salad.'),
  ('ebe3cb46-3655-4672-9537-05e7e8308b5f', 'Chicken Milanesa (Breaded Fillet)', 'Breaded, fried fillet served with white rice, French fries and fresh salad.'),

  ('e087356f-06db-4266-ac03-d1fb378016ae', 'Seafood Rice (Large)', 'A blend of creamy rice with fresh, delicious seafood — a fusion of flavors and textures from the sea.'),
  ('d34339e2-60d4-45bd-b52a-f67b78e47033', 'Seafood Rice (Medium)', 'A blend of creamy rice with fresh, delicious seafood — a fusion of flavors and textures from the sea.'),
  ('72ec9c11-13e4-4be7-b5c6-21c446bf2583', 'Fried Cabrilla / Sea Bass (Large)', 'A classic seafood dish. Local fresh fish, fried to perfection with a crispy, golden crust.'),
  ('a6ed5356-c3bc-4192-97c3-64cb5a3811e5', 'Fried Cabrilla / Sea Bass (Medium)', 'A classic seafood dish. Local fresh fish, fried to perfection with a crispy, golden crust.'),
  ('526226d9-bcd4-44f8-8049-fe68348eec3d', 'Amazonian Cecina / Dried Pork (Large)', 'Cecina is a delicious, traditional dish from the Peruvian jungle — a culinary treasure served with patacones (fried plantains).'),
  ('48cc842c-8b12-4b82-8308-e05b4a9eebfb', 'Amazonian Cecina / Dried Pork (Medium)', 'Cecina is a delicious, traditional dish from the Peruvian jungle — a culinary treasure served with patacones (fried plantains).'),
  ('501172b7-a613-4a87-a523-5deebb77c6b4', 'House Ceviche (Large)', 'Fresh cabrilla (sea bass) fillets, caught daily, marinated in lime juice and tossed with onion and cilantro.'),
  ('8825d9ea-f681-4e23-81f1-a7d20305db4f', 'House Ceviche (Medium)', 'Fresh cabrilla (sea bass) fillets, caught daily, marinated in lime juice and tossed with onion and cilantro.'),
  ('0cd4034e-2ce0-46d8-a635-8a6a3480eedc', 'House Ceviche (Personal)', 'Fresh cabrilla (sea bass) fillets, caught daily, marinated in lime juice and tossed with onion and cilantro.'),
  ('5283ac75-42d8-428e-91a3-5b1609458e86', 'Rock Ceviche / Goose Barnacles (Large)', 'Fresh, tender goose barnacles, marinated in lime juice and tossed with onion and cilantro.'),
  ('e71a41a3-0baf-4c07-b46e-bd7c89e252bc', 'Rock Ceviche / Goose Barnacles (Medium)', 'Fresh, tender goose barnacles, marinated in lime juice and tossed with onion and cilantro.'),
  ('c015d23c-1b3d-4ed5-ba82-dda0b4c15c21', 'Ocean Ceviche (Large)', 'Fresh fish fillet and a selection of seafood, marinated in lime juice, spices, onion and cilantro.'),
  ('8dc85781-340b-4052-b487-041b002c38aa', 'Ocean Ceviche (Medium)', 'Fresh fish fillet and a selection of seafood, marinated in lime juice, spices, onion and cilantro.'),
  ('38c9cdf3-d662-4fee-a444-35309504ccfb', 'Lobitos-Style Ceviche (Large)', 'A mix of cabrilla (sea bass) fillet with exotic goose barnacles, marinated in lime juice and tossed with onion and cilantro.'),
  ('be04350b-b43c-4c01-af4c-3964384868d5', 'Lobitos-Style Ceviche (Medium)', 'A mix of cabrilla (sea bass) fillet with exotic goose barnacles, marinated in lime juice and tossed with onion and cilantro.'),
  ('b613a8de-fdc2-430f-9a9e-8681df46a7c4', 'Tropical Ceviche (Large)', 'Select swordfish, marinated in lime juice and tossed with onion and cilantro.'),
  ('14c559e0-2384-44b5-ae11-f63a8d2ab81b', 'Tropical Ceviche (Medium)', 'Select swordfish, marinated in lime juice and tossed with onion and cilantro.'),
  ('6dd159ea-bc34-4429-b53a-51ed3e4143ba', 'Fried Fish or Chicken Chicharrón (Large)', 'Fillets seasoned with a touch of northern Peruvian magic and fried to perfection — crispy outside, tender inside — served with French fries.'),
  ('851eb3d6-b7f7-40b9-8a59-b50f19597623', 'Fried Fish or Chicken Chicharrón (Medium)', 'Fillets seasoned with a touch of northern Peruvian magic and fried to perfection — crispy outside, tender inside — served with French fries.'),
  ('3d79b3c3-9c25-4f88-b05a-bcbe31fd3acc', 'Northern-Style Mashed Plantain with Seafood (Large)', 'A delicious combination of mashed green plantain with select seafood.'),
  ('f46bbcfe-2cb8-4aca-8185-a41b90983939', 'Northern-Style Mashed Plantain with Seafood (Medium)', 'A delicious combination of mashed green plantain with select seafood.'),
  ('db3404e4-0a99-4999-bd36-8ad6e1fc0574', 'Seco de Chabelo / Plantain & Beef Stew (Large)', 'A delicious combination of a rich, aromatic sauce, mashed green plantain and tasty beef.'),
  ('188ec8c3-7eba-497b-8a9a-c18924fdd4c2', 'Seco de Chabelo / Plantain & Beef Stew (Medium)', 'A delicious combination of a rich, aromatic sauce, mashed green plantain and tasty beef.'),
  ('cc6bc153-5894-49d0-8cf3-03659f2aafd5', 'Sudado / Peruvian Fish Stew (Large)', 'A savory seafood dish. A stew-like soup with fresh fish, onion, tomato and escabeche, served with rice.'),
  ('b5c452a8-3b04-4af0-9044-654059583c73', 'Sudado / Peruvian Fish Stew (Medium)', 'A savory seafood dish. A stew-like soup with fresh fish, onion, tomato and escabeche, served with rice.'),

  ('9e0fbee8-6b91-407d-9b58-5c109247b54d', 'Cora del Mar (House Seafood Special)', 'An exquisite combination of chaufa fried rice with fish stir-fry, served with crispy French fries.'),
  ('e0c2c02b-7e68-4391-8080-f2bbfb39e908', 'Grilled Octopus', 'Seasoned grilled octopus, served with glazed sweet potato and fresh salad.'),
  ('1d67308c-37cb-47be-9a07-312647ef87d5', 'Octopus in Olive Sauce', 'Thin slices of octopus cooked in an olive and olive oil sauce with a touch of lime, served with avocado and baguette bread or crackers.'),

  ('b24c128f-586a-47d5-8cea-1d52e9c5c2e1', 'Shrimp Omelette', 'Egg-based omelette served with white rice and crispy French fries.'),
  ('b02159f5-a6ed-40e2-bb0d-c544b1d27561', 'Barnacle Omelette', 'Egg-based omelette served with white rice and crispy French fries.')
) as v(id, nombre_en, descripcion_en)
where m.id = v.id::uuid;
