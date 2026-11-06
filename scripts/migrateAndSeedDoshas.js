import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = await import('../config/db.js');

async function migrateAndSeed() {
  console.log('--- Starting Migration & Seeding: Doshas Module ---');

  // 1. Create table `doshas` if not exists
  console.log('Creating table `doshas`...');
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS doshas (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        sanskrit_name VARCHAR(100) NULL,
        slug VARCHAR(120) NOT NULL UNIQUE,
        title VARCHAR(200) NOT NULL,
        subtitle VARCHAR(255) NULL,
        category ENUM('marriage', 'planetary', 'karmic', 'nakshatra', 'general') NOT NULL DEFAULT 'general',
        severity ENUM('low', 'medium', 'high', 'severe') NOT NULL DEFAULT 'medium',
        affected_planets JSON NOT NULL,
        affected_houses JSON NULL,
        excerpt TEXT NULL,
        description LONGTEXT NOT NULL,
        effects LONGTEXT NULL,
        cancellations LONGTEXT NULL,
        remedies JSON NOT NULL,
        featured_image VARCHAR(512) NULL,
        status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INT NOT NULL DEFAULT 0,
        views_count INT NOT NULL DEFAULT 0,
        meta_title VARCHAR(255) NULL,
        meta_description VARCHAR(500) NULL,
        meta_keywords VARCHAR(255) NULL,
        canonical_url VARCHAR(512) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        INDEX idx_doshas_slug (slug),
        INDEX idx_doshas_category (category),
        INDEX idx_doshas_status_active (status, is_active),
        INDEX idx_doshas_sort_order (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Table `doshas` ensured.');

  // 2. Initial 5 Classical Vedic Doshas Seeds
  const seeds = [
    {
      id: uuidv4(),
      name: 'Mangal Dosha',
      sanskrit_name: 'मंगल दोष / कुज दोष',
      slug: 'mangal-dosha',
      title: 'Mangal Dosha (Manglik): Astrological Causes, Effects on Marriage & Classical Cancellations',
      subtitle: 'The placement of Mars in the 1st, 4th, 7th, 8th, or 12th house and its impact on matrimonial harmony.',
      category: 'marriage',
      severity: 'high',
      affected_planets: JSON.stringify(['Mars']),
      affected_houses: JSON.stringify([1, 4, 7, 8, 12]),
      excerpt: 'Mangal Dosha occurs when Mars occupies the 1st, 4th, 7th, 8th, or 12th house from the Lagna, Moon, or Venus, causing delays, friction, and temperament clashes in marriage.',
      description: 'In classical Vedic astrology (Brihat Parasara Hora Shastra), Mangal Dosha (also known as Kuja Dosha or Bhauma Dosha) is formed when the fiery warrior planet Mars resides in the 1st (Ascendant), 4th, 7th, 8th, or 12th house from the Lagna (Ascendant), Chandra (Moon), or Shukra (Venus). Because the 7th house rules marriage and partnership, Mars creates intense heat, ego friction, impulsiveness, and sudden discord in relationships unless counterbalanced by classical cancellation rules.',
      effects: '1. Delays in finding a suitable spouse or sudden relationship disruptions.\n2. Temperamental clashes, high expectations, and domestic friction.\n3. Career or health fluctuations of the native or spouse during active Mars Dasha periods.\n4. Emotional distance if Mars is in the 12th house (bed pleasures and foreign settlement).',
      cancellations: 'Classical Vedic astrology gives over 20 cancellation rules (Nivaran):\n1. When both bride and groom are Manglik, the dosha cancels out completely.\n2. If Mars occupies its own sign (Aries or Scorpio), exaltation sign (Capricorn), or Leo.\n3. If Mars is placed with or aspected by powerful benefic Jupiter (Guru) or Moon (Chandra).\n4. In the 7th house in Cancer or Capricorn, Mars causes no blemish.\n5. If the native is past 28 years of age, Mars energy matures and mellows.',
      remedies: JSON.stringify([
        { type: 'puja', title: 'Kumbh Vivah / Vishnu Vivah', description: 'Classical ritual marriage performed with a clay pot or sacred peepal tree prior to the formal wedding.' },
        { type: 'mantra', title: 'Mangal Beej Mantra', description: 'Recite "Om Kram Kreem Kroum Sah Bhaumaya Namah" 108 times daily on Tuesdays facing South.' },
        { type: 'fasting', title: 'Tuesday Vrat', description: 'Fast on Tuesdays or consume a single salt-free meal prepared with wheat and jaggery.' },
        { type: 'donation', title: 'Red Lentils & Copper', description: 'Donate Masoor dal (red lentils), copper utensils, or red clothes to the needy on Tuesdays.' },
        { type: 'deity', title: 'Lord Hanuman Worship', description: 'Recite Hanuman Chalisa daily and visit a Hanuman temple every Tuesday and Saturday.' }
      ]),
      featured_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      is_active: true,
      sort_order: 1,
      meta_title: 'Mangal Dosha Guide: Meaning, Effects, Cancellation & Remedies | Japaika',
      meta_description: 'Discover everything about Mangal Dosha (Manglik). Understand how it affects marriage, classical cancellation rules, and time-tested Vedic remedies.',
      meta_keywords: 'mangal dosha, manglik, kuja dosha, marriage compatibility, vedic remedies, kumbh vivah',
      canonical_url: 'https://japaika.com/doshas/mangal-dosha'
    },
    {
      id: uuidv4(),
      name: 'Kala Sarpa Dosha',
      sanskrit_name: 'काल सर्प दोष',
      slug: 'kala-sarpa-dosha',
      title: 'Kala Sarpa Dosha: Types, Karmic Obstacles & Powerful Vedic Remedies',
      subtitle: 'The serpentine karmic enclosure when all seven visible planets are hemmed between Rahu and Ketu.',
      category: 'karmic',
      severity: 'severe',
      affected_planets: JSON.stringify(['Rahu', 'Ketu']),
      affected_houses: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      excerpt: 'Formed when all visible planets are hemmed between Rahu and Ketu, Kala Sarpa Dosha produces sudden reversals, intense struggles in youth, and deep spiritual metamorphosis.',
      description: 'Kala Sarpa Dosha is a profound karmic configuration where all seven physical planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn) are enclosed on one axis between the lunar nodes Rahu (Dragon\'s Head) and Ketu (Dragon\'s Tail). Depending on the houses Rahu and Ketu occupy, 12 distinct types of Kala Sarpa Yoga are identified (Ananta, Kulika, Vasuki, Shankhapala, Padma, Mahapadma, Takshaka, Karkotaka, Shankhachuda, Ghataka, Vishadhara, and Sheshanaag).',
      effects: '1. Hardships and severe struggles in early adulthood (until age 33 or 42).\n2. Unexplained delays in career recognition, financial stability, and domestic peace.\n3. Disturbing dreams, fear of reptiles, or mysterious health symptoms.\n4. Immense potential for extraordinary success and spiritual breakthrough after intense perseverance.',
      cancellations: '1. If even one planet escapes outside the Rahu-Ketu axis, it becomes "Kalamrita Yoga" or "Ardh Kala Sarpa", significantly softening the malefic impact.\n2. When Rahu or Ketu is conjunct a benefic planet (like Jupiter or Venus) in an angle (Kendra) or trine (Trikona).\n3. In the second half of life (especially after age 42), the dosha often transforms into a powerful catalyst for wealth and spiritual elevation.',
      remedies: JSON.stringify([
        { type: 'puja', title: 'Kala Sarpa Shanti Puja', description: 'Perform Shanti ritual at sacred pilgrimage shrines like Kalahasti (AP) or Trimbakeshwar (Nashik).' },
        { type: 'mantra', title: 'Maha Mrityunjaya Mantra', description: 'Chant "Om Tryambakam Yajamahe Sugandhim Pushti-Vardhanam" 108 times at sunrise.' },
        { type: 'deity', title: 'Lord Shiva & Naga Puja', description: 'Offer milk, sacred water (Gangajal), and Bilva leaves on a Shivling every Monday and during Pradosham.' },
        { type: 'charity', title: 'Feed Animals', description: 'Feed stray dogs (associated with Ketu) and birds with multi-grain seeds regularly.' }
      ]),
      featured_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      is_active: true,
      sort_order: 2,
      meta_title: 'Kala Sarpa Dosha: 12 Types, Symptoms & Remedies | Japaika',
      meta_description: 'Complete guide to Kala Sarpa Dosha. Learn about the 12 classical types, life impacts, and authentic Shiva remedies for relief.',
      meta_keywords: 'kala sarpa dosha, kaal sarp yog, rahu ketu, maha mrityunjaya, trimbakeshwar shanti',
      canonical_url: 'https://japaika.com/doshas/kala-sarpa-dosha'
    },
    {
      id: uuidv4(),
      name: 'Pitru Dosha',
      sanskrit_name: 'पितृ दोष',
      slug: 'pitru-dosha',
      title: 'Pitru Dosha: Ancestral Karmic Debts, Signs & Classical Tarpan Remedies',
      subtitle: 'The 9th house affliction representing unfulfilled ancestral duties and family tree blockages.',
      category: 'karmic',
      severity: 'high',
      affected_planets: JSON.stringify(['Sun', 'Saturn', 'Rahu']),
      affected_houses: JSON.stringify([9, 5]),
      excerpt: 'Pitru Dosha represents karmic ancestral debt reflected in the 9th house of lineage, causing lineage obstacles, recurrent financial hurdles, and domestic instability.',
      description: 'In Brihat Parasara Hora Shastra, Pitru Dosha is formed when the Sun (Pitru Karaka - significator of father and ancestors) or the 9th house of Dharma and lineage is afflicted by Rahu, Ketu, or Saturn. It signifies unresolved ancestral obligations, unperformed death rites (Shradh), or inherited karmic debts that impede the natural flow of blessing to descendants.',
      effects: '1. Recurrent obstacles in having children or lineage continuation (Putra Bhava affliction).\n2. Chronic financial instability despite dedicated hard work and talent.\n3. Frequent unprovoked family arguments and disharmony among siblings.\n4. Restlessness, recurring nightmares of departed elders, or unexplainable illness in family members.',
      cancellations: '1. When strong Jupiter aspects the 9th house or 5th house.\n2. When sincere annual Shradh rites, Tarpan, and Pind Daan rituals are conducted at holy tirthas.\n3. Regular acts of selfless charity in the name of departed souls neutralize the negative debt.',
      remedies: JSON.stringify([
        { type: 'puja', title: 'Pind Daan & Tarpan at Gaya', description: 'Perform formal ancestral rites (Shradh) during Pitru Paksha at holy sites like Gaya, Varanasi, or Haridwar.' },
        { type: 'charity', title: 'Feed Cows and Crows', description: 'Feed black cows and crows with sweet chapatis or cooked rice every Amavasya (New Moon).' },
        { type: 'ritual', title: 'Peepal Tree Arghya', description: 'Water a sacred Peepal tree on Saturdays with water, raw milk, and sesame seeds (Til).' },
        { type: 'mantra', title: 'Gayatri Mantra & Aditya Hridaya', description: 'Recite Gayatri Mantra 108 times daily and offer water (Arghya) to the rising Sun.' }
      ]),
      featured_image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      is_active: true,
      sort_order: 3,
      meta_title: 'Pitru Dosha: Meaning, Symptoms, Shradh & Remedies | Japaika',
      meta_description: 'Understand Pitru Dosha in Vedic astrology. Learn the signs of ancestral debt and classical Tarpan and charity remedies to invite peace and prosperity.',
      meta_keywords: 'pitru dosha, ancestral karma, shradh, gaya pind daan, peepal tree worship',
      canonical_url: 'https://japaika.com/doshas/pitru-dosha'
    },
    {
      id: uuidv4(),
      name: 'Guru Chandal Dosha',
      sanskrit_name: 'गुरु चाण्डाल दोष',
      slug: 'guru-chandal-dosha',
      title: 'Guru Chandal Dosha: Jupiter-Rahu Conjunction, Effects & Upayas',
      subtitle: 'The clash of divine wisdom (Guru) and material illusion (Rahu) in a single house.',
      category: 'planetary',
      severity: 'medium',
      affected_planets: JSON.stringify(['Jupiter', 'Rahu']),
      affected_houses: JSON.stringify([]),
      excerpt: 'Occurring when Jupiter (Guru) is conjunct or aspected by Rahu, Guru Chandal Dosha challenges moral clarity, career standing, and spiritual focus.',
      description: 'Guru Chandal Dosha is formed when Jupiter (Devaguru - significator of wisdom, ethics, higher knowledge, wealth, and children) is conjunct or closely aspected by the shadow planet Rahu. While Jupiter represents Dharma, purity, and spiritual devotion, Rahu represents unorthodoxy, illusion, obsession, and materialism. Their fusion creates intellectual skepticism, conflict with mentors, and sudden legal or financial turbulence.',
      effects: '1. Difficulties in completing higher education or unexpected career disruptions.\n2. Questioning sacred traditions, falling into misleading ideological traps or unethical schemes.\n3. Financial losses from risky speculative investments or betrayal by trusted advisers.\n4. Challenges regarding children\'s wellbeing or parental relationships.',
      cancellations: '1. If Jupiter has high Shadbala or is placed in its own sign (Sagittarius, Pisces) or exaltation sign (Cancer).\n2. If Jupiter is placed in a Kendra (1, 4, 7, 10) or Trikona (1, 5, 9) while Rahu is at a different degree (> 10° apart).\n3. When aspected by benefic Venus or Moon.',
      remedies: JSON.stringify([
        { type: 'deity', title: 'Lord Vishnu & Brihaspati Worship', description: 'Worship Lord Vishnu on Thursdays and recite Vishnu Sahasranama.' },
        { type: 'mantra', title: 'Guru Beej Mantra', description: 'Chant "Om Gram Greem Groum Sah Gurave Namah" 108 times every Thursday morning.' },
        { type: 'charity', title: 'Donations on Thursday', description: 'Donate yellow items such as chana dal (yellow lentils), turmeric, yellow flowers, and saffron sweets to brahmins or students.' },
        { type: 'service', title: 'Respecting Teachers & Elders', description: 'Actively respect and serve spiritual mentors, elderly parents, and teachers.' }
      ]),
      featured_image: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      is_active: true,
      sort_order: 4,
      meta_title: 'Guru Chandal Dosha: Causes, Symptoms & Remedies | Japaika',
      meta_description: 'Learn how the Jupiter-Rahu conjunction creates Guru Chandal Dosha. Discover astrological remedies and classical cancellations for wisdom and prosperity.',
      meta_keywords: 'guru chandal dosha, jupiter rahu conjunction, brihaspati puja, vishnu sahasranama',
      canonical_url: 'https://japaika.com/doshas/guru-chandal-dosha'
    },
    {
      id: uuidv4(),
      name: 'Ganda Moola Dosha',
      sanskrit_name: 'गण्डमूल दोष',
      slug: 'ganda-moola-dosha',
      title: 'Ganda Moola Dosha: Birth in Junction Nakshatras & 27th Day Shanti',
      subtitle: 'The sensitive sandhi transition between water and fire zodiac signs.',
      category: 'nakshatra',
      severity: 'medium',
      affected_planets: JSON.stringify(['Mercury', 'Ketu']),
      affected_houses: JSON.stringify([]),
      excerpt: 'Formed when a child is born in one of the 6 sensitive junction Nakshatras ruled by Mercury or Ketu, requiring Nakshatra Shanti on the 27th day after birth.',
      description: 'In Vedic nakshatra cosmology, Ganda Moola Dosha occurs when a native is born with the Moon positioned in one of six specific lunar mansions: Ashwini, Ashlesha, Magha, Jyeshtha, Moola, or Revati. These nakshatras represent the cosmic transition zones (Rashi Sandhi & Nakshatra Sandhi) between water signs (Cancer, Scorpio, Pisces) and fire signs (Leo, Sagittarius, Aries). These intense boundary points create volatile physical, mental, or domestic energy in early childhood.',
      effects: '1. Health vulnerability, recurrent fevers, or restlessness in early infancy.\n2. Temporary stress or financial expenses for parents during the initial months.\n3. Unique temperament: deeply intuitive, intense, unconventional, and visionary personalities when harmonized.\n4. Padas 1 and 4 of these nakshatras carry distinct results for mother, father, or wealth.',
      cancellations: '1. The dosha is traditionally neutralized through the "Moola Shanti" ritual performed 27 days after birth when the Moon returns to the same nakshatra.\n2. If the Moon has strong Paksha Bala (bright fortnight near Purnima) and is aspected by benefic planets.\n3. The native often achieves grand success and societal leadership once the adolescent years pass.',
      remedies: JSON.stringify([
        { type: 'puja', title: '27th Day Nakshatra Shanti', description: 'Perform classical Moola Shanti Homa on the 27th day after birth with water collected from 27 sacred sources.' },
        { type: 'deity', title: 'Lord Ganesha Worship', description: 'Worship Lord Ganesha with Durva grass and modaks to harmonize Ketu nakshatras (Ashwini, Magha, Moola).' },
        { type: 'mantra', title: 'Nakshatra Deity Stotra', description: 'Chant the presiding deity\'s mantra for the specific birth nakshatra.' },
        { type: 'donation', title: 'Feed Green Grass to Cows', description: 'Feed green grass (palak/fodder) to cows on Wednesdays for Mercury nakshatras (Ashlesha, Jyeshtha, Revati).' }
      ]),
      featured_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      status: 'published',
      is_active: true,
      sort_order: 5,
      meta_title: 'Ganda Moola Dosha: Meaning, 6 Nakshatras & Shanti Rituals | Japaika',
      meta_description: 'Complete guide to Ganda Moola Dosha. Understand birth in Ashlesha, Magha, Moola, Jyeshtha, Revati & Ashwini, and the traditional 27th day Shanti puja.',
      meta_keywords: 'ganda moola dosha, moola shanti, gandmool nakshatra, ashlesha jyeshtha, revati magha',
      canonical_url: 'https://japaika.com/doshas/ganda-moola-dosha'
    }
  ];

  for (const s of seeds) {
    const [existing] = await sequelize.query(`SELECT id FROM doshas WHERE slug = ?`, {
      replacements: [s.slug]
    });

    if (existing.length === 0) {
      console.log(`Seeding dosha "${s.name}" (${s.slug})...`);
      await sequelize.query(`
        INSERT INTO doshas (
          id, name, sanskrit_name, slug, title, subtitle, category, severity,
          affected_planets, affected_houses, excerpt, description, effects, cancellations,
          remedies, featured_image, status, is_active, sort_order,
          meta_title, meta_description, meta_keywords, canonical_url
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `, {
        replacements: [
          s.id, s.name, s.sanskrit_name, s.slug, s.title, s.subtitle, s.category, s.severity,
          s.affected_planets, s.affected_houses, s.excerpt, s.description, s.effects, s.cancellations,
          s.remedies, s.featured_image, s.status, s.is_active, s.sort_order,
          s.meta_title, s.meta_description, s.meta_keywords, s.canonical_url
        ]
      });
    } else {
      console.log(`Dosha "${s.name}" already exists. Skipping.`);
    }
  }

  // 3. Verify final state
  const [total] = await sequelize.query(`SELECT COUNT(*) as count FROM doshas`);
  console.log(`Total doshas in DB: ${total[0].count}`);

  console.log('--- Migration & Seeding Finished Successfully ---');
  process.exit(0);
}

migrateAndSeed().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
