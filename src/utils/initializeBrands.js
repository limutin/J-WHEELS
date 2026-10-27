import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const initializeAllBrands = async () => {
  const defaultBrands = [
    // Major Motorcycle Manufacturers
    'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'KTM',
    'Ducati', 'BMW Motorrad', 'Harley-Davidson', 'Triumph', 'Royal Enfield',
    'Aprilia', 'Husqvarna', 'Beta', 'Gas Gas', 'Sherco',
    
    // Engine & Performance Parts
    'NGK', 'Denso', 'Bosch', 'Champion', 'Autolite',
    'Wiseco', 'JE Pistons', 'CP Pistons', 'Vertex', 'ProX',
    'Hot Cams', 'Web Cam', 'Kibblewhite', 'Cometic', 'Athena',
    
    // Oil & Lubricants
    'Motul', 'Shell', 'Castrol', 'Mobil 1', 'Liqui Moly',
    'Bel-Ray', 'Maxima', 'Motorex', 'Yamalube', 'Honda GN4',
    
    // Brake Systems
    'Brembo', 'Nissin', 'EBC', 'Galfer', 'Ferodo',
    'Bendix', 'Akebono', 'TRW', 'SBS', 'Braking',
    
    // Filters
    'K&N', 'HiFlo Filtro', 'Twin Air', 'Uni Filter', 'No Toil',
    'BMC', 'DNA', 'Pipercross', 'Moose Racing', 'Maxima Racing',
    
    // Tires
    'Michelin', 'Pirelli', 'Dunlop', 'Bridgestone', 'Metzeler',
    'Continental', 'Shinko', 'IRC', 'Maxxis', 'Kenda',
    
    // Chain & Sprockets
    'DID', 'RK', 'EK', 'Regina', 'Renthal',
    'JT Sprockets', 'Vortex', 'Sunstar', 'PBR', 'Afam',
    
    // Suspension
    'Ohlins', 'WP Suspension', 'Showa', 'Fox Racing', 'KYB',
    'Traxxion', 'Race Tech', 'Hyperpro', 'Progressive', 'Elka',
    
    // Clutch
    'FCC', 'Barnett', 'EBC Clutch', 'Hinson', 'Rekluse',
    'Wiseco Clutch', 'DP Brakes', 'Magura', 'Tusk', 'ProX Clutch',
    
    // Electrical
    'Denso Electric', 'NGK Wires', 'Bosch Electric', 'Yuasa', 'Shorai',
    'Ballistic', 'Antigravity', 'Motobatt', 'JMT', 'MotoMaster',
    
    // Exhaust Systems
    'Akrapovic', 'Yoshimura', 'FMF', 'Pro Circuit', 'Two Brothers Racing',
    'Arrow', 'SC Project', 'Termignoni', 'LeoVince', 'Vance & Hines',
    
    // Cables & Controls
    'Motion Pro', 'Venhill', 'Magura Controls', 'Barnett Cables', 'Pro Taper',
    'Renthal Controls', 'TAG Metals', 'Works Connection', 'Moose Cables', 'Tusk Controls',
    
    // Bearings & Seals
    'All Balls Racing', 'SKF', 'Koyo', 'NTN', 'Timken',
    'Pivot Works', 'Hot Rods', 'Pro X Bearings', 'Moose Bearings', 'Tusk Bearings',
    
    // Gaskets & Engine Parts
    'Cometic Gaskets', 'Athena Gaskets', 'Vesrah', 'Moose Gaskets', 'Hot Rods Engine',
    'Wiseco Pistons', 'ProX Engine', 'Vertex Pistons', 'Namura', 'Mitaka',
    
    // Body & Plastics
    'Acerbis', 'Polisport', 'UFO', 'Cycra', 'Maier',
    'Racetech', 'Moose Plastics', 'Tusk Plastics', 'Works Connection Plastics', 'TMD',
    
    // Lighting
    'Baja Designs', 'Cyclops', 'Trail Tech', 'Denali', 'Rigid',
    'LED Concepts', 'Custom Dynamics', 'Kuryakyn', 'Moose Lighting', 'Tusk Lighting',
    
    // Handlebars & Grips
    'Renthal Bars', 'Pro Taper Bars', 'TAG Metals Bars', 'Answer', 'Easton',
    'ODI', 'Pro Grip', 'Scott', 'Spider Grips', 'Moose Grips',
    
    // Air Filters & Intake
    'K&N Filters', 'Twin Air Filters', 'No Toil Filters', 'Uni Filter Air', 'Maxima Filters',
    'DNA Filters', 'BMC Filters', 'Pipercross Filters', 'Moose Filters', 'Tusk Filters',
    
    // Cooling System
    'Engine Ice', 'Water Wetter', 'Evans', 'Motul Coolant', 'Maxima Coolant',
    'Mishimoto', 'Fluidyne', 'Moose Cooling', 'Tusk Cooling', 'Trail Tech Cooling',
    
    // Fuel System
    'Mikuni', 'Keihin', 'FCR', 'PWK', 'DynoJet',
    'Lectron', 'Boyesen', 'Vortex Fuel', 'ProX Fuel', 'All Balls Fuel',
    
    // Tools & Maintenance
    'Motion Pro Tools', 'Tusk Tools', 'Bikemaster', 'Park Tool', 'Beta Tools',
    'Maxima Tools', 'Motul Maintenance', 'Bel-Ray Tools', 'PJ1', 'WD-40',
    
    // Generic & Other
    'OEM', 'Genuine Parts', 'Aftermarket', 'Racing Parts',
    'Performance Parts', 'Heavy Duty', 'Premium', 'Standard', 'Other'
  ];

  console.log(`Starting to add ${defaultBrands.length} brands...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const brand of defaultBrands) {
    try {
      await addDoc(collection(db, 'brands'), {
        name: brand,
        createdAt: new Date().toISOString(),
      });
      successCount++;
      console.log(`Added: ${brand} (${successCount}/${defaultBrands.length})`);
    } catch (error) {
      errorCount++;
      console.error(`Failed to add ${brand}:`, error);
    }
  }

  console.log(`\n✅ Initialization complete!`);
  console.log(`✅ Successfully added: ${successCount} brands`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} brands`);
  }

  return { successCount, errorCount, total: defaultBrands.length };
};
