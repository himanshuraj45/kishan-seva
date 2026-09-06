'use client';

import React, { useState } from 'react';
import { Search, AlertTriangle, Bug, Leaf, X, ChevronRight, Droplets, ThermometerSun, Check, Globe, Shield, SearchCode, Beaker, FileSpreadsheet, Filter, MapPin, ShieldAlert, Thermometer, ArrowRight, Share2, FlaskConical, Stethoscope } from 'lucide-react';
import massiveDiseases from './massive_diseases.json';

const PAGE_BG = { background: '#f9fafb', minHeight: '100vh', paddingBottom: 100 };

// Injected from Executive Research Summary
const DISEASES: any[] = [
  ...massiveDiseases,
  // WHEAT
  {
    id: 'd1',
    name: 'Wheat Stripe Rust (Yellow Rust)',
    scientific: 'Puccinia striiformis f. sp. tritici',
    crop: 'Wheat',
    severity: 'High',
    cause: 'Fungal (Basidiomycete)',
    region: 'Global',
    growth_stage: 'Vegetative to Flowering',
    affected_hosts: 'Wheat (Triticum aestivum, T. durum) and some grasses. Hosts include spring and winter wheats.',
    symptoms: [
      'Linear yellow-orange pustules (uredinia) appear in stripes along leaf veins.',
      'Early on, plants show small yellow flecks; pustules rupture epidermis in rows.',
      'Severe early infections cause stunting.',
      'Advanced stage shows necrotic stripes and brownish-black stem lesions.'
    ],
    conditions: 'Prefers cool, moist conditions (optimal 10–15°C nights) with dew or fog; can sporulate at 0–25°C. Overwintering on volunteer wheat and mild weather allow early build-up.',
    cycle: 'Urediniospores are wind-dispersed and infect via stomata. Asexual cycle repeats rapidly. In some regions, Berberis species act as alternate hosts. No sexual stage occurs on wheat host.',
    diagnosis: 'Field diagnosis by yellow linear pustules on leaves. Lab culture or PCR assays confirm. Differentiate from leaf rust which has round, orange-brown pustules.',
    impact: 'Can cause 20–100% yield loss if uncontrolled. Losses of ~40% are common in epidemics.',
    prevention: 'Use certified clean seed; rotate with non-host crops; control volunteer wheat. Remove barberry in temperate regions. Implement airborne spore monitoring.',
    organic: ['Biocontrols (Trichoderma or Bacillus) have limited efficacy.', 'Botanical treatments (neem oil, copper) may reduce spore survival.', 'Encourage natural antagonists and maintain healthy soil.'],
    chemical: ['Azoxystrobin, propiconazole, propamocarb target rust.', 'Use mixtures with different modes of action to delay resistance.', 'e.g. tebuconazole applied at 250 g/ha with 14-day PHI.'],
    ipm: 'Integrate resistant cultivars with timely fungicide use. Early detection + forecasting is critical. Alternate non-hosts in crop rotation.',
    geography: 'Temperate wheat-growing regions globally. Has become more common in warmer climates since 2000.',
    differential: 'Distinguish from leaf rust (orange, rounded) or powdery mildew (white powdery growth).'
  },
  {
    id: 'd1b',
    name: 'Wheat Stem Rust (Black Rust)',
    scientific: 'Puccinia graminis f. sp. tritici',
    crop: 'Wheat',
    severity: 'Critical',
    cause: 'Fungal',
    affected_hosts: 'Wheat, barley, and barberry (alternate host).',
    symptoms: ['Brick-red, elongated pustules on stems, leaves, and leaf sheaths.', 'Pustules rupture the epidermis, creating ragged edges.', 'In late season, pustules turn black as teliospores form.'],
    conditions: 'Warm temperatures (15–30°C) and free moisture (dew or light rain) are optimal.',
    cycle: 'Complex life cycle involving five spore stages and an alternate host (Berberis vulgaris). However, can continually reinfect wheat via windblown urediniospores.',
    diagnosis: 'Identified by the ragged edges of ruptured epidermis on stems and large brick-red pustules.',
    impact: 'One of the most devastating plant diseases historically (e.g., Ug99 strain). Can completely destroy a healthy crop 3 weeks before harvest.',
    prevention: 'Eradicate common barberry. Use genetically resistant cultivars.',
    organic: ['Copper-based fungicides', 'Sulfur dust'],
    chemical: ['Propiconazole', 'Tebuconazole', 'Azoxystrobin applied protectively.'],
    ipm: 'Eradication of alternate hosts, resistant varieties, and fungicide application guided by spore trapping.',
    geography: 'Historically worldwide, but controlled in many areas until the emergence of the Ug99 race in East Africa.',
    differential: 'Differentiate from leaf and stripe rust by its preference for stems and large, ragged, dark red pustules.'
  },

  // CORN / MAIZE
  {
    id: 'd2',
    name: 'Southern Rust of Corn',
    scientific: 'Puccinia polysora',
    crop: 'Maize',
    severity: 'High',
    cause: 'Fungal (Pucciniaceae)',
    affected_hosts: 'Maize (Zea mays, field and sweet corn) and some related grasses.',
    symptoms: [
      'Small, circular orange pustules mostly on the upper leaf surface.',
      'Pustules (1-2mm) erupt through epidermis releasing powdery orange spores.',
      'Lesions age to dark brown-black.',
      'Severe infection causes chlorosis and necrosis in leaf sheaths, husks, stalks.'
    ],
    conditions: 'Favors high humidity and warm temperatures (~25–30°C). Requires several hours of leaf wetness. Typically appears late in season.',
    cycle: 'Monocyclic in temperate zones: windborne spores from south. Infects within days, sporulates in 7-14 days. Pustule produces spores for 5-7 days. Builds up quickly in hot-humid spells.',
    diagnosis: 'Distinctive small orange pustules densely covering upper leaves. Differentiate from common rust (which is brick-red, on both surfaces).',
    impact: 'Very destructive. Reduces yield by 10–50% or more. Considered more severe than common rust due to rapid epidemics.',
    prevention: 'Use resistant hybrids. Rotate with non-hosts. Destroy crop residue. Monitor regional alerts. Early planting may avoid peak spore influx.',
    organic: ['No reliable organic cures.', 'Kaolin clay or Bacillus subtilis trialed with limited success.', 'Emphasize cultural hygiene.'],
    chemical: ['Early foliar fungicide often needed when ~50% of leaves have ≥1 pustule.', 'Propiconazole, azoxystrobin, pyraclostrobin.', 'Full labeled rates; multiple applications may be required.'],
    ipm: 'Integrate crop rotation, host resistance, timely scouting of upper canopies. Coordinate with neighboring farms to manage regional inoculum.',
    geography: 'Native to tropical Americas, now widespread globally. In US, infects southern states regularly, moves north mid-late season.',
    differential: 'Distinguish from common rust and Physoderma brown spot (purple-brown lesions without removable spores).'
  },
  {
    id: 'd2b',
    name: 'Fall Armyworm Infestation',
    scientific: 'Spodoptera frugiperda',
    crop: 'Maize',
    severity: 'Critical',
    cause: 'Pest (Lepidoptera)',
    affected_hosts: 'Maize is primary, but affects over 80 plant species including sorghum, rice, and cotton.',
    symptoms: ['Window-pane feeding marks on young leaves.', 'Massive defoliation leaving only leaf ribs.', 'Frass (sawdust-like excrement) in the whorl.', 'Direct feeding damage on corn ears.'],
    conditions: 'Thrives in warm, tropical, and subtropical climates. Can migrate thousands of kilometers.',
    cycle: 'Moth lays egg masses on leaves. Larvae hatch, feed aggressively, then pupate in the soil. Entire lifecycle takes ~30 days in warm weather.',
    diagnosis: 'Identify caterpillars by the distinct inverted "Y" shape on the head and four dark spots arranged in a square on the second-to-last abdominal segment.',
    impact: 'Can cause total crop failure if whorl is destroyed early or if ears are severely attacked.',
    prevention: 'Early planting, weed control, intercropping with repellant plants (Push-Pull strategy).',
    organic: ['Neem oil applications to the whorl.', 'Release of natural predators (Trichogramma wasps).', 'Hand-picking in small plots.'],
    chemical: ['Spinetoram', 'Chlorantraniliprole', 'Emamectin benzoate applied directly into the whorl.'],
    ipm: 'Push-Pull habitat management, pheromone traps for monitoring, Bt corn varieties, targeted synthetic applications.',
    geography: 'Native to Americas; aggressively invaded Africa, Asia, and Oceania since 2016.',
    differential: 'Differentiate from Corn Earworm (lacks inverted Y on head).'
  },

  // RICE
  {
    id: 'r1',
    name: 'Rice Blast',
    scientific: 'Magnaporthe oryzae',
    crop: 'Rice',
    severity: 'Critical',
    cause: 'Fungal',
    affected_hosts: 'Rice (Oryza sativa) and some grasses.',
    symptoms: ['Diamond or spindle-shaped lesions with gray/white centers and dark brown margins.', 'Collar rot at the junction of leaf blade and sheath.', 'Neck blast: lesions at the panicle base causing "blanking" or whiteheads.', 'Node infection causing stem breakage.'],
    conditions: 'Prolonged leaf wetness, high humidity (>90%), and mild temperatures (25-28°C). Excessive nitrogen fertilizer increases susceptibility.',
    cycle: 'Spores (conidia) land on leaves, form an appressorium to penetrate the plant. Cycle completes in 7 days, allowing explosive secondary spread.',
    diagnosis: 'Spindle-shaped lesions are classic. Microscopic observation of pyriform, 3-celled conidia.',
    impact: 'Most devastating rice disease globally. Destroys enough rice annually to feed 60 million people.',
    prevention: 'Plant resistant varieties (Pi genes). Avoid excessive nitrogen. Silica soil amendments.',
    organic: ['Strains of Bacillus subtilis and Pseudomonas fluorescens.', 'Silicon fertilizers to toughen cell walls.', 'Extracts of neem and tulsi.'],
    chemical: ['Tricyclazole (systemic, highly effective against neck blast)', 'Azoxystrobin', 'Isoprothiolane.'],
    ipm: 'Split nitrogen applications, continuous flooding (avoids drought stress which increases susceptibility), resistant cultivars, and weather-based fungicide timing.',
    geography: 'Present in over 85 countries; anywhere rice is grown.',
    differential: 'Distinguish from brown spot (which has round, strictly brown lesions without the gray center).'
  },
  {
    id: 'r2',
    name: 'Bacterial Leaf Blight',
    scientific: 'Xanthomonas oryzae pv. oryzae',
    crop: 'Rice',
    severity: 'High',
    cause: 'Bacterial',
    affected_hosts: 'Rice',
    symptoms: ['Water-soaked to yellowish stripes along the leaf margins.', 'Lesions enlarge, coalesce, and turn whitish-grey.', 'Ooze (milky bacterial exudate) drops may form on lesions in morning dew.', 'Kresek (seedling wilt) phase in early severe infections.'],
    conditions: 'High temperatures (28-34°C), high humidity, strong winds, and heavy rains (typhoons/monsoons) which cause wounds for entry.',
    cycle: 'Bacteria survive in seeds, stubble, and weeds. Enter through hydathodes or wounds. Spread via irrigation water and rain splash.',
    diagnosis: 'Look for bacterial ooze. Cut a symptomatic leaf, place in a glass of water, and observe milky bacterial streaming from the cut edge.',
    impact: 'Can cause 20-50% yield loss; up to 100% in Kresek phase.',
    prevention: 'Plant resistant varieties (Xa genes). Ensure good field drainage. Avoid clipping seedling tips during transplanting.',
    organic: ['Copper oxychloride (limited efficacy)', 'Pseudomonas fluorescens seed treatments.', 'Proper spacing.'],
    chemical: ['Streptomycin + Copper combinations (e.g., Streptocycline).', 'Chemical control is often ineffective once established.'],
    ipm: 'Primarily relies on genetic resistance, field sanitation (plowing under stubble), and balanced fertilization.',
    geography: 'Major issue in Asia, but present in Africa and the Americas.',
    differential: 'Differentiate from Bacterial Leaf Streak (which has strictly interveinal linear streaks).'
  },

  // POTATO & TOMATO
  {
    id: 'd3',
    name: 'Late Blight',
    scientific: 'Phytophthora infestans',
    crop: 'Potato & Tomato',
    severity: 'Critical',
    cause: 'Oomycete (Water mold)',
    affected_hosts: 'Potato (Solanum tuberosum), Tomato (S. lycopersicum), and related Solanaceae.',
    symptoms: [
      'Rapidly expanding water-soaked lesions on leaves, stems, fruit.',
      'Leaf spots are large, irregular, brown-black with pale green borders.',
      'White fuzzy sporulation on undersides under high humidity.',
      'Tubers develop firm, brown decays with pinkish sporangia on cut surfaces.'
    ],
    conditions: 'Favors cool (10–18°C), wet conditions. Requires 6–12h leaf wetness. Slows in hot, dry weather.',
    cycle: 'Airborne sporangia initiate infection. New sporangia form in 3-5 days. Polycyclic asexual cycle. Sexual oospores in warm soils enable long-term survival.',
    diagnosis: 'Large, greasy lesions with white sporulation under moist conditions. PCR assays or ELISA can confirm. Must be distinguished from early blight.',
    impact: 'High potential for devastation. Can cause total yield loss. Historically caused the Irish potato famine.',
    prevention: 'Rotate away from solanaceous crops 3-4 years. Use certified disease-free seed. Destroy cull piles/volunteers. Provide good air circulation. Irrigate in mornings.',
    organic: ['Copper fungicides (Bordeaux mixture) applied protectively.', 'Bacillus or Trichoderma have limited effect.', 'Planting resistant varieties (Rpi genes) is highly effective.'],
    chemical: ['Systemic oomycete-targeting fungicides (mefenoxam, cymoxanil) and protectants (chlorothalonil).', 'Rotate active ingredients.', 'Apply on 7-10 day schedule in conducive weather.'],
    ipm: 'Emphasize resistant cultivars and cultural barriers. Apply fungicides early. Use forecasting systems (BlightCast). Monitor regularly.',
    geography: 'Worldwide wherever hosts grow. Outbreaks coincide with rainy cool periods.',
    differential: 'Distinguish from early blight (target rings, older foliage) and physiological leaf necrosis. White sporulation is key.'
  },
  {
    id: 'd4',
    name: 'Fusarium Wilt',
    scientific: 'Fusarium oxysporum',
    crop: 'Tomato',
    severity: 'High',
    cause: 'Soilborne Fungal',
    affected_hosts: 'Tomato (Solanum lycopersicum). Overcomes most older resistances.',
    symptoms: [
      'Bright yellowing of leaves/shoots on ONE side of the plant.',
      'Wilted shoots and yellowing progress to branch dieback and canopy collapse.',
      'Fruits under dead foliage may sunscald or rot.',
      'Chocolate-brown discoloration of vascular tissue in stems when cut.'
    ],
    conditions: 'Warm soil temperatures (25–30°C). Often appears mid-season under hot, dry conditions. Soil pH extremes or poor fertility increases susceptibility.',
    cycle: 'Infects through roots and colonizes xylem, blocking water. No airborne spores; spreads via infected soil/debris. Chlamydospores persist in soil for years.',
    diagnosis: 'Brown vascular streaks in wilted plants. Lab plating on selective media or PCR assays. Soil bioassays used.',
    impact: '30–50% yield loss in susceptible cultivars. One of the greatest economic threats to tomato processing in some regions.',
    prevention: 'Use resistant rootstocks. Crop rotation for 3-4 years. Solarize soil. Use sterilized potting mix for transplants. Clean equipment.',
    organic: ['Compost teas, Trichoderma inoculants sometimes used but variable efficacy.', 'Soil solarization and anaerobic soil disinfestation (ASD).'],
    chemical: ['No effective curative fungicides.', 'Soil fumigants (chloropicrin) can reduce inoculum but are costly.', 'Seed treatments (steaming or formaldehyde).'],
    ipm: 'Avoid infested fields. Use resistant rootstocks. Combine crop sanitation with soil amendments that boost antagonists.',
    geography: 'Present wherever tomatoes are grown (especially warm temperate and tropical).',
    differential: 'Distinguish from Verticillium wilt (has tan vascular streaks instead of brown) and abiotic nutrient disorders.'
  },
  {
    id: 'pt1',
    name: 'Early Blight',
    scientific: 'Alternaria solani',
    crop: 'Potato & Tomato',
    severity: 'Moderate',
    cause: 'Fungal',
    affected_hosts: 'Potato, Tomato, Eggplant.',
    symptoms: ['Small dark brown-to-black spots on older leaves.', 'Lesions enlarge to form distinct concentric rings (target-board appearance).', 'Severe infection causes lower leaves to turn yellow and drop off.', 'Dark, sunken lesions on tomato fruits and potato tubers.'],
    conditions: 'Alternating wet and dry weather, heavy dew, temperatures between 24-29°C. Primarily affects stressed or senescing plants.',
    cycle: 'Survives in crop debris and soil. Conidia are spread by wind and rain splash. Spores germinate in free moisture.',
    diagnosis: 'Target-board concentric rings in lesions are the hallmark. Found mostly on older, lower leaves first.',
    impact: 'Causes defoliation, reducing fruit size and yield by 20-30%. Less explosive than Late Blight, but highly persistent.',
    prevention: 'Maintain vigorous plant growth via proper fertilization. Stake/trellis tomatoes. 3-year crop rotation.',
    organic: ['Copper and sulfur sprays.', 'Serenade (Bacillus subtilis).', 'Removing infected lower leaves.'],
    chemical: ['Chlorothalonil', 'Mancozeb', 'Azoxystrobin.'],
    ipm: 'Proper plant nutrition, drip irrigation (avoid wetting foliage), bottom pruning, and protectant fungicides.',
    geography: 'Worldwide, extremely common in most home gardens and commercial fields.',
    differential: 'Differentiate from Septoria leaf spot (smaller spots with grey centers and black pepper-like fruiting bodies).'
  },

  // COTTON
  {
    id: 'c1',
    name: 'Cotton Leaf Curl Virus (CLCuV)',
    scientific: 'Begomovirus (Cotton leaf curl virus)',
    crop: 'Cotton',
    severity: 'Critical',
    cause: 'Viral',
    affected_hosts: 'Cotton (Gossypium hirsutum) and some malvaceous weeds (okra, hollyhock).',
    symptoms: ['Upward or downward curling of leaf margins.', 'Thickening and swelling of veins on the underside of leaves.', 'Formation of cup-shaped enations (leaf-like outgrowths) on veins.', 'Severe stunting and reduced boll formation.'],
    conditions: 'Prevalent during hot, dry periods which favor rapid multiplication of the whitefly vector.',
    cycle: 'Transmitted exclusively by the silverleaf whitefly (Bemisia tabaci) in a persistent manner. Cannot be transmitted by sap, seeds, or contact.',
    diagnosis: 'Vein thickening and enations are diagnostic. PCR required for specific strain identification.',
    impact: 'Can cause massive crop failures (up to 90% yield loss) if infection occurs in the early seedling stage. Devastated Pakistan’s cotton industry in the 1990s.',
    prevention: 'Eradicate alternative weed hosts. Use resistant or tolerant cotton varieties. Establish a cotton-free period.',
    organic: ['Neem oil or insecticidal soaps to suppress whiteflies.', 'Yellow sticky traps.', 'Conserving natural whitefly predators.'],
    chemical: ['Imidacloprid, Dinotefuran, or Spiromesifen to control the whitefly vector.', 'Seed treatments with systemic insecticides protect seedlings.'],
    ipm: 'Vector management is key. Synchronized planting, destroying crop residues, and strict whitefly monitoring.',
    geography: 'Major threat in the Indian subcontinent (India, Pakistan) and parts of Africa.',
    differential: 'Differentiate from herbicide damage (2,4-D causes strap-like leaves) and thrips damage.'
  },
  {
    id: 'c2',
    name: 'Pink Bollworm',
    scientific: 'Pectinophora gossypiella',
    crop: 'Cotton',
    severity: 'Critical',
    cause: 'Pest (Lepidoptera)',
    affected_hosts: 'Cotton is the primary host, okra secondary.',
    symptoms: ['"Rosetted" blooms (petals tied together by silk).', 'Bolls fail to open or open partially with rotten lint.', 'Exit holes in the bolls.', 'Pinkish larvae found feeding directly inside the seeds.'],
    conditions: 'Warm, dry weather. Larvae diapause inside seeds over winter.',
    cycle: 'Moths lay eggs on bolls. Larvae bore into the boll, feed on seeds, cutting lint. Pupation occurs in the soil or boll.',
    diagnosis: 'Cut open green bolls; look for pink-banded larvae and stained lint.',
    impact: 'Massive reduction in lint quality and yield. Directly destroys the harvestable product.',
    prevention: 'Strict destruction of crop residues post-harvest. Mandatory closed seasons (no cotton).',
    organic: ['Mating disruption via pheromone dispensers (PB-Rope).', 'Release of Trichogramma wasps.'],
    chemical: ['Spinosad, Emamectin benzoate applied when scouting indicates thresholds are breached.'],
    ipm: 'Bt Cotton (though resistance is emerging in India). Pheromone traps for monitoring. Prompt harvesting.',
    geography: 'Global cotton-growing regions; severe resistance issues in India.',
    differential: 'Differentiate from American Bollworm (Helicoverpa) which feeds with its body half outside the boll.'
  },

  // SUGARCANE
  {
    id: 's1',
    name: 'Red Rot',
    scientific: 'Colletotrichum falcatum',
    crop: 'Sugarcane',
    severity: 'Critical',
    cause: 'Fungal',
    affected_hosts: 'Sugarcane',
    symptoms: ['Yellowing and drying of upper leaves, progressing downwards.', 'Stems lose color and shrink.', 'When split open, canes show red tissue with white cross-bands.', 'Alcoholic or sour smell from infected canes.'],
    conditions: 'High humidity, waterlogging, and temperatures of 27-32°C. Spreads rapidly during monsoon rains.',
    cycle: 'Inoculum survives in infected setts (cuttings) and crop debris. Rain splash and irrigation water spread spores. Stem borer holes provide entry.',
    diagnosis: 'Splitting the cane to reveal red internals with white transverse bands is the definitive field test.',
    impact: 'Known as the "cancer of sugarcane". Destroys sucrose content entirely, causing massive economic losses.',
    prevention: 'Use disease-free setts for planting. Uproot and burn infected clumps. Ensure proper field drainage.',
    organic: ['Soak setts in Trichoderma viride solution before planting.', 'Crop rotation with rice or green manure.'],
    chemical: ['Fungicidal sett treatments (e.g., Carbendazim) before planting.', 'Foliar sprays are largely ineffective once systemic.'],
    ipm: 'Plant resistant varieties (crucial). Ensure borer pest control to minimize entry wounds. Practice ratoon management.',
    geography: 'Severe in subtropical Asia (India, Pakistan) and the Americas.',
    differential: 'Differentiate from Wilt (wilt lacks the characteristic white cross-bands in the red tissue).'
  },

  // BANANA
  {
    id: 'b1',
    name: 'Panama Disease (TR4)',
    scientific: 'Fusarium oxysporum f. sp. cubense (Tropical Race 4)',
    crop: 'Banana',
    severity: 'Critical',
    cause: 'Soilborne Fungal',
    affected_hosts: 'Banana (Musa spp.), especially Cavendish cultivars.',
    symptoms: ['Yellowing of older leaves, advancing to the skirt.', 'Leaves collapse at the petiole, forming a skirt of dead leaves.', 'Splitting of the pseudostem base.', 'Reddish-brown vascular discoloration inside the pseudostem.'],
    conditions: 'Humid, tropical soils. Easily spread via contaminated mud on boots, machinery, or floodwaters.',
    cycle: 'Pathogen infects roots, invades xylem, and blocks water transport. Chlamydospores can survive in soil for over 30 years without a host.',
    diagnosis: 'Vascular browning in the pseudostem. Specific TR4 identification requires VCG (Vegetative Compatibility Group) testing or PCR.',
    impact: 'Existential threat to the global Cavendish banana export industry. Wiped out Gros Michel in the 1950s (Race 1).',
    prevention: 'Strict quarantine and biosecurity. Foot baths (quaternary ammonium) at farm entries. Do not move shared machinery.',
    organic: ['No cure. Bio-fumigation and organic amendments (compost) are being researched to suppress the fungus.'],
    chemical: ['No effective chemical control available.'],
    ipm: 'Total reliance on exclusion and strict biosecurity. Development of TR4-resistant GMO or mutant varieties is ongoing.',
    geography: 'Originating in SE Asia, now present in Australia, Middle East, Africa, and recently South America (Colombia, Peru).',
    differential: 'Differentiate from Bacterial Wilt / Moko disease (Moko causes fruit rot and bacterial ooze; Panama does not affect fruit internally).'
  },

  // FRUIT & MISC
  {
    id: 'f1',
    name: 'Citrus Greening (HLB)',
    scientific: 'Candidatus Liberibacter asiaticus',
    crop: 'Citrus',
    severity: 'Critical',
    cause: 'Bacterial',
    affected_hosts: 'All Citrus species (Oranges, Lemons, Grapefruit).',
    symptoms: ['Asymmetrical, blotchy mottling of leaves (not uniform like nutrient deficiency).', 'Fruits are small, lopsided, and remain green at the stylar end.', 'Fruits taste bitter and salty.', 'Severe branch dieback and eventual tree death.'],
    conditions: 'Tropical and subtropical climates that support the vector (Asian Citrus Psyllid).',
    cycle: 'Systemic bacteria phloem-limited. Transmitted by grafting and the Asian Citrus Psyllid (Diaphorina citri).',
    diagnosis: 'Blotchy mottle crossing leaf veins. PCR of midribs is required for confirmation.',
    impact: 'The most destructive citrus disease worldwide. Has devastated the Florida citrus industry, cutting production by over 70%.',
    prevention: 'Use certified disease-free nursery stock. Remove and destroy infected trees immediately.',
    organic: ['Reflective mulch to deter psyllids.', 'Release of parasitoid wasps (Tamarixia radiata).', 'Enhanced nutritional programs to prolong tree life.'],
    chemical: ['Aggressive insecticide programs (Imidacloprid, Thiamethoxam) to control the psyllid vector.', 'Recent approvals for trunk injections of oxytetracycline.'],
    ipm: 'Areawide psyllid control, robust nutritional support, thermotherapy, and immediate rogueing of infected trees.',
    geography: 'Asia, Americas (Florida, Brazil, California), parts of Africa.',
    differential: 'Differentiate from Zinc deficiency (which causes symmetrical interveinal chlorosis).'
  },
  {
    id: 'f2',
    name: 'Apple Scab',
    scientific: 'Venturia inaequalis',
    crop: 'Apple',
    severity: 'High',
    cause: 'Fungal',
    affected_hosts: 'Apples and Crabapples.',
    symptoms: ['Olive-green, velvety spots on leaves that turn black and cause premature defoliation.', 'Brown, corky, scabby spots on fruit.', 'Severely infected fruits become deformed and crack open.'],
    conditions: 'Cool, wet springs. Spore release is triggered by rain and requires specific hours of leaf wetness based on temperature (Mills Table).',
    cycle: 'Overwinters in fallen leaves. Ascospores shoot into the air during spring rains, infecting new blossoms and leaves. Conidia cause secondary summer infections.',
    diagnosis: 'Velvety olive-green lesions on leaves and scab-like corky lesions on fruit.',
    impact: 'Severe cosmetic damage makes fruit unmarketable. Defoliation weakens the tree.',
    prevention: 'Rake and destroy fallen leaves (urea sprays to accelerate decomposition). Prune for open canopy air flow.',
    organic: ['Sulfur and Liquid Copper applied protectively.', 'Potassium bicarbonate.', 'Plant scab-resistant cultivars (e.g., Honeycrisp, Liberty).'],
    chemical: ['Captan, Mancozeb, Myclobutanil.', 'Must be applied preventatively based on weather forecasting models.'],
    ipm: 'Use weather-based disease forecasting (Mills periods) to time fungicide sprays. Orchard sanitation.',
    geography: 'Worldwide, especially problematic in cool, wet, temperate regions.',
    differential: 'Differentiate from Powdery Mildew (white fuzzy growth) and Cedar Apple Rust (bright orange spots).'
  }
];

export default function DiseaseLibraryPage() {
  const [search, setSearch] = useState('');
  const [filterCrop, setFilterCrop] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [selected, setSelected] = useState<typeof DISEASES[0] | null>(null);
  const [aiDiseases, setAiDiseases] = useState<typeof DISEASES>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiError, setAiError] = useState('');

  const combinedDiseases = [...DISEASES, ...aiDiseases];

  const filtered = combinedDiseases.filter(d => {
    if (filterCrop !== 'All' && !d.crop.includes(filterCrop)) return false;
    if (filterSeverity !== 'All' && d.severity !== filterSeverity) return false;
    if (filterRegion !== 'All' && d.region && !d.region.includes(filterRegion)) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.symptoms.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const handleAiSearch = async () => {
    if (!search) return;
    setIsAiSearching(true);
    setAiError('');
    
    try {
      const res = await fetch('/api/v1/disease-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search })
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setAiDiseases([data.data, ...aiDiseases]);
        setSearch(''); // Clear search so they can see it added to the top
        setSelected(data.data); // Open it immediately
      } else {
        setAiError(data.error || 'Failed to synthesize profile.');
      }
    } catch (err) {
      setAiError('Failed to connect to the database.');
    } finally {
      setIsAiSearching(false);
    }
  };

  const categories = ['All', 'Wheat', 'Maize', 'Rice', 'Tomato', 'Potato', 'Onion', 'Cotton', 'Sugarcane', 'Banana', 'Citrus', 'Soybean', 'Apple'];
  const severities = ['All', 'Low', 'Moderate', 'High', 'Critical'];
  const regions = ['All', 'Global', 'Asia', 'North America', 'South America', 'Europe', 'Africa', 'Tropics'];

  return (
    <div style={PAGE_BG}>
      <div style={{ background: '#fff', padding: '32px 28px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={14} /> Comprehensive Database
            </span>
            <span style={{ background: '#fdf4ff', color: '#86198f', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Globe size={14} /> Global Profiles
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.03em' }}>Disease Library</h1>
          
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search 500+ detailed pathogen and pest profiles..." 
              style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: 12, border: '1px solid #d1d5db', outline: 'none', fontSize: '1rem' }} 
            />
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f3f4f6', padding: '4px 12px', borderRadius: 20 }}>
              <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Severity:</span>
              <select 
                value={filterSeverity} 
                onChange={e => setFilterSeverity(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: 600, color: '#111827', cursor: 'pointer' }}
              >
                {severities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f3f4f6', padding: '4px 12px', borderRadius: 20 }}>
              <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Region:</span>
              <select 
                value={filterRegion} 
                onChange={e => setFilterRegion(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: 600, color: '#111827', cursor: 'pointer' }}
              >
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 4 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilterCrop(c)} style={{ padding: '8px 16px', borderRadius: 20, fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: filterCrop === c ? '#2d6a27' : '#f3f4f6', color: filterCrop === c ? '#fff' : '#4b5563', transition: 'background 0.2s' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #d1d5db' }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <SearchCode size={24} color="#6b7280" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>No local profiles found</h3>
            <p style={{ color: '#4b5563', margin: '0 0 24px', fontSize: '0.95rem' }}>We don't have a pre-indexed profile for "{search}". However, you can synthesize one from the global AI database.</p>
            
            <button 
              onClick={handleAiSearch} 
              disabled={isAiSearching}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 30, fontSize: '1rem', fontWeight: 700, cursor: isAiSearching ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: isAiSearching ? 0.7 : 1, transition: '0.2s' }}
            >
              {isAiSearching ? 'Synthesizing Pathogen Data...' : 'Synthesize AI Profile'} 
              {isAiSearching ? <span style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Globe size={18} />}
            </button>
            {aiError && <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: 12, fontWeight: 600 }}>{aiError}</div>}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map(d => (
            <div key={d.id} onClick={() => setSelected(d)} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ede7', padding: 20, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{d.name}</h3>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontStyle: 'italic' }}>{d.scientific}</div>
                </div>
                <span style={{ background: d.severity === 'Critical' ? '#7f1d1d' : (d.severity === 'High' ? '#fef2f2' : '#fffbeb'), color: d.severity === 'Critical' ? '#fff' : (d.severity === 'High' ? '#dc2626' : '#d97706'), padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                  {d.severity} Risk
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{d.crop}</span>
                <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>{d.cause}</span>
                {d.region && <span style={{ background: '#f5f3ff', color: '#6d28d9', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{d.region}</span>}
              </div>
              {d.growth_stage && (
                <div style={{ marginBottom: 12, fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>
                  <span style={{ color: '#9ca3af' }}>Stage:</span> {d.growth_stage}
                </div>
              )}
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {d.symptoms.join(' ')}
              </p>
              
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', color: '#16a34a', fontSize: '0.875rem', fontWeight: 700 }}>
                View Full Profile <ChevronRight size={16} style={{ marginLeft: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSelected(null)} />
          <div style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: 800, borderRadius: 20, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '24px 32px 20px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>{selected.name}</h2>
                <div style={{ fontSize: '1rem', color: '#475569', fontStyle: 'italic', marginBottom: 12 }}>{selected.scientific}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: '#e2e8f0', color: '#334155', padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>{selected.crop}</span>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>{selected.cause}</span>
                  <span style={{ background: selected.severity === 'Critical' ? '#7f1d1d' : '#fef2f2', color: selected.severity === 'Critical' ? '#fff' : '#dc2626', padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>{selected.severity} Impact</span>
                  {selected.growth_stage && <span style={{ background: '#ecfccb', color: '#3f6212', padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>Stage: {selected.growth_stage}</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '0', overflowY: 'auto', flex: 1, backgroundColor: '#fff' }}>
              <div style={{ padding: '32px' }}>
                
                {/* 1. Affected Hosts & Geography */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><Leaf size={18} color="#16a34a" /> Affected Hosts</h4>
                    <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6 }}>{selected.affected_hosts}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={18} color="#0ea5e9" /> Geographic Distribution</h4>
                    <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6 }}>{selected.geography}</p>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '0 0 32px 0' }} />

                {/* 2. Symptoms & Diagnosis */}
                <div style={{ marginBottom: 32 }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><SearchCode size={20} color="#8b5cf6" /> Symptoms & Diagnosis</h4>
                  <div style={{ background: '#f5f3ff', padding: 20, borderRadius: 12, border: '1px solid #ede9fe', marginBottom: 16 }}>
                    <ul style={{ margin: 0, paddingLeft: 24, color: '#4c1d95', fontSize: '0.95rem', lineHeight: 1.6 }}>
                      {selected.symptoms.map((s: string, i: number) => <li key={i} style={{ marginBottom: 8 }}>{s}</li>)}
                    </ul>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Lab / Field Diagnosis</strong>
                      <span style={{ fontSize: '0.9rem', color: '#334155' }}>{selected.diagnosis}</span>
                    </div>
                    <div style={{ background: '#fff1f2', padding: 16, borderRadius: 12, border: '1px solid #ffe4e6' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#9f1239', textTransform: 'uppercase', marginBottom: 4 }}>Differential Diagnosis</strong>
                      <span style={{ fontSize: '0.9rem', color: '#881337' }}>{selected.differential}</span>
                    </div>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '0 0 32px 0' }} />

                {/* 3. Cycle & Conditions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><ThermometerSun size={18} color="#ea580c" /> Favorable Conditions</h4>
                    <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6 }}>{selected.conditions}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><Bug size={18} color="#059669" /> Disease Cycle</h4>
                    <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6 }}>{selected.cycle}</p>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '0 0 32px 0' }} />

                {/* 4. Treatment & Management */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={20} color="#2563eb" /> Treatment & Management</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ background: '#eff6ff', padding: 20, borderRadius: 12, border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Beaker size={16}/> Chemical Control</div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: '#1e3a8a', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {selected.chemical.map((t: string, i: number) => <li key={i} style={{ marginBottom: 6 }}>{t}</li>)}
                      </ul>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 12, border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Leaf size={16}/> Organic / Natural</div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: '#14532d', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {selected.organic.map((o: string, i: number) => <li key={i} style={{ marginBottom: 6 }}>{o}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>Prevention & Cultural Control</strong>
                    <span style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.6 }}>{selected.prevention}</span>
                  </div>

                  <div style={{ background: '#ffedd5', padding: 20, borderRadius: 12, border: '1px solid #fed7aa' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#c2410c', textTransform: 'uppercase', marginBottom: 8 }}>Integrated Pest Management (IPM)</strong>
                    <span style={{ fontSize: '0.95rem', color: '#9a3412', lineHeight: 1.6 }}>{selected.ipm}</span>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
