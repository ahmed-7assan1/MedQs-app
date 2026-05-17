import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEMS = [
  { id: "skeletal",       label: "Skeletal",       color: "from-teal-500/20 to-teal-500/5", border: "border-teal-500/20", iconColor: "text-teal-400", iconName: "Bone", desc: "Bones, joints, and structural support" },
  { id: "muscular",       label: "Muscular",       color: "from-red-500/20 to-red-500/5", border: "border-red-500/20", iconColor: "text-red-400", iconName: "Dumbbell", desc: "Movement and force generation" },
  { id: "nervous",        label: "Nervous",        color: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/20", iconColor: "text-purple-400", iconName: "Brain", desc: "Central & peripheral control" },
  { id: "cardiovascular", label: "Cardiovascular", color: "from-rose-500/20 to-rose-500/5", border: "border-rose-500/20", iconColor: "text-rose-400", iconName: "Heart", desc: "Heart and blood vessels" },
  { id: "respiratory",    label: "Respiratory",    color: "from-cyan-500/20 to-cyan-500/5", border: "border-cyan-500/20", iconColor: "text-cyan-400", iconName: "Wind", desc: "Gas exchange and airways" },
  { id: "digestive",      label: "Digestive",      color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", iconColor: "text-amber-400", iconName: "Utensils", desc: "Processing and nutrient absorption" },
  { id: "endocrine",      label: "Endocrine",      color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", iconColor: "text-emerald-400", iconName: "FlaskConical", desc: "Hormonal regulation" },
  { id: "urinary",        label: "Urinary",        color: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/20", iconColor: "text-orange-400", iconName: "Droplets", desc: "Filtration and excretion" },
  { id: "lymphatic",      label: "Lymphatic",      color: "from-indigo-500/20 to-indigo-500/5", border: "border-indigo-500/20", iconColor: "text-indigo-400", iconName: "Shield", desc: "Immunity and fluid balance" },
  { id: "special_senses", label: "Special Senses", color: "from-fuchsia-500/20 to-fuchsia-500/5", border: "border-fuchsia-500/20", iconColor: "text-fuchsia-400", iconName: "Eye", desc: "Vision, hearing, and balance" },
];

const DB = [
  // SKELETAL
  {id:"frontal-bone",name:"Frontal Bone",latin:"Os frontale",sys:"skeletal",region:"Head",type:"bone",desc:"Forms the forehead and anterior cranial floor. Contains frontal sinuses.",fn:"Protects frontal lobe, forms orbital roof",blood:null,nerve:null,relations:["Parietal bone","Ethmoid","Sphenoid","Nasal bone"],clinical:"Fracture may cause CSF rhinorrhoea. Frontal sinus fractures indicate significant trauma. Cavernous sinus thrombosis can complicate frontal sinusitis.",memo:null},
  {id:"parietal-bone",name:"Parietal Bone",latin:"Os parietale",sys:"skeletal",region:"Head",type:"bone",desc:"Paired flat bones forming superior and lateral cranial vault. Articulate at sagittal suture.",fn:"Protects parietal lobes of brain",blood:"Middle meningeal artery grooves inner surface",nerve:null,relations:["Frontal bone","Temporal bone","Occipital bone"],clinical:"Middle meningeal artery in groove on inner surface — extradural haematoma after temporal trauma. Paget's disease may cause bony thickening.",memo:"'Middle Meningeal = Lateral (Pterion)'"},
  {id:"temporal-bone",name:"Temporal Bone",latin:"Os temporale",sys:"skeletal",region:"Head",type:"bone",desc:"Complex paired bones housing middle and inner ear. Parts: petrous, squamous, tympanic, mastoid.",fn:"Protects inner ear, houses auditory ossicles, supports TMJ",blood:null,nerve:"CN VII passes through stylomastoid foramen",relations:["Parietal bone","Occipital bone","Sphenoid","Zygomatic bone"],clinical:"Fractures: longitudinal (80%, hemotympanum, conductive loss) vs transverse (20%, SNHL, facial nerve palsy). Mastoiditis from otitis media. Petrous tip = base of skull cancer staging.",memo:null},
  {id:"occipital-bone",name:"Occipital Bone",latin:"Os occipitale",sys:"skeletal",region:"Head",type:"bone",desc:"Forms posterior cranial fossa. Contains foramen magnum where brainstem becomes spinal cord.",fn:"Protects cerebellum and brainstem, articulates with atlas C1",blood:null,nerve:null,relations:["Foramen magnum","Atlas C1","Parietal bones","Temporal bones"],clinical:"Foramen magnum herniation ('coning') = life-threatening. Occipital condyles articulate with atlas. Occipital neuralgia from C2 irritation.",memo:null},
  {id:"sphenoid",name:"Sphenoid Bone",latin:"Os sphenoidale",sys:"skeletal",region:"Head",type:"bone",desc:"'Butterfly-shaped' central skull base bone. Contains sella turcica (pituitary fossa). Numerous foramina for cranial nerves.",fn:"Central keystone of skull base, houses pituitary gland",blood:null,nerve:null,relations:["Pituitary gland","Cavernous sinus","Optic chiasm"],clinical:"Pituitary tumour expands sella on X-ray ('double floor'). Sphenoid wing fractures injure CN III/IV/V1/V2/VI. Cavernous sinus related to body.",memo:"Foramina: 'Standing Room Only' = Superior orbital fissure, Round, Ovale, Spinosum"},
  {id:"ethmoid",name:"Ethmoid Bone",latin:"Os ethmoidale",sys:"skeletal",region:"Head",type:"bone",desc:"Sieve-like bone forming medial orbital wall and nasal septum. Cribriform plate transmits olfactory nerves.",fn:"Forms nasal cavity roof, medial orbit, supports olfactory nerves",blood:null,nerve:"CN I (olfactory) passes through cribriform plate",relations:["Frontal bone","Sphenoid","Nasal bones","Lacrimal bone"],clinical:"Cribriform plate fracture → CSF rhinorrhoea. Ethmoid sinusitis can spread to orbit (orbital cellulitis) or intracranially.",memo:null},
  {id:"mandible",name:"Mandible",latin:"Mandibula",sys:"skeletal",region:"Head",type:"bone",desc:"Lower jaw — only moveable skull bone. Body + two rami with condylar and coronoid processes.",fn:"Chewing, speech, supports lower teeth",blood:"Inferior alveolar artery (from maxillary artery)",nerve:"Inferior alveolar nerve (CN V3)",relations:["TMJ","Maxilla","Hyoid bone"],clinical:"Most common facial fracture. Weakest at condyle, angle, mental foramen. CN V3 injury in wisdom tooth extraction.",memo:"TMJ dislocation: condyle anterior to articular eminence. 'Open wide and it pops out'"},
  {id:"maxilla",name:"Maxilla",latin:"Maxilla",sys:"skeletal",region:"Head",type:"bone",desc:"Paired bones forming upper jaw, hard palate, orbital floor/medial wall, lateral nasal wall. Bears upper teeth.",fn:"Upper jaw architecture, floor of orbit",blood:"Infraorbital artery, posterior superior alveolar artery",nerve:"Infraorbital nerve (V2), superior alveolar nerves",relations:["Mandible","Zygomatic","Nasal bones","Frontal bone"],clinical:"Le Fort fractures: I (horizontal above teeth), II (pyramidal), III (craniofacial dysjunction).",memo:"Le Fort III = 'Face separated from skull'"},
  {id:"zygomatic",name:"Zygomatic Bone",latin:"Os zygomaticum",sys:"skeletal",region:"Head",type:"bone",desc:"Cheekbone — forms bony prominence of cheek and part of orbital rim. Forms zygomatic arch with temporal bone.",fn:"Protects lateral orbit, cheek prominence",blood:null,nerve:"Zygomatic nerve (V2)",relations:["Temporal bone","Maxilla","Frontal bone","Sphenoid"],clinical:"Tripod fracture (commonest isolated facial fracture): 3 sites in zygomatic arch. Blow-out fracture of orbit floor.",memo:null},
  {id:"cervical-spine",name:"Cervical Vertebrae (C1-C7)",latin:"Vertebrae cervicales",sys:"skeletal",region:"Neck",type:"bone",desc:"7 cervical vertebrae. C1 (atlas): ring-shaped, no body. C2 (axis): dens projects superiorly for rotation. C3-C7: bifid spinous processes, transverse foramina for vertebral arteries.",fn:"Supports head, protects spinal cord, wide range of neck movement",blood:"Vertebral arteries through transverse foramina C6-C1",nerve:null,relations:["Skull","Brainstem","Spinal cord","Vertebral arteries"],clinical:"Hangman's fracture: C2 pedicle fractures (hyperextension). Jefferson's fracture: C1 burst (axial load). Whiplash: C4-C6. Vertebral arteries vulnerable in C-spine fractures.",memo:"C1=Atlas (holds world/skull); C2=Axis (axle for rotation)"},
  {id:"thoracic-spine",name:"Thoracic Vertebrae (T1-T12)",latin:"Vertebrae thoracicae",sys:"skeletal",region:"Back",type:"bone",desc:"12 thoracic vertebrae articulating with ribs. Heart-shaped bodies, long downward spinous processes, costal facets.",fn:"Rib attachment, thoracic stability, spinal cord protection",blood:null,nerve:null,relations:["Ribs","Sternum","Thoracic spinal cord"],clinical:"Most stable vertebral region. Schmorl's nodes = disc herniation into vertebral body. T4 = sternal angle (angle of Louis), T10 = umbilicus, T12 = last rib.",memo:"'T4 = Tracheal bifurcation and Trans-aortic arch'"},
  {id:"lumbar-spine",name:"Lumbar Vertebrae (L1-L5)",latin:"Vertebrae lumbales",sys:"skeletal",region:"Lower back",type:"bone",desc:"5 large vertebrae with largest bodies, no transverse foramina or costal facets.",fn:"Supports body weight, spinal cord protection, allows trunk flexion",blood:null,nerve:null,relations:["L1-L5 nerve roots","Cauda equina","Conus medullaris L1-2"],clinical:"L4/5 and L5/S1 most common disc herniations. Lumbar puncture at L3-4 or L4-5 (below conus medullaris at L1-2). Spondylolisthesis: L4 slips on L5.",memo:"LP at L3-4 or L4-5: 'Super Innominate Tuberous Tip Leaps' for levels"},
  {id:"sacrum",name:"Sacrum",latin:"Os sacrum",sys:"skeletal",region:"Pelvis",type:"bone",desc:"5 fused vertebrae. Triangular bone at base of vertebral column. Articulates with L5, ilium, and coccyx.",fn:"Transmits body weight to pelvis, sacral nerve root housing",blood:null,nerve:"S2-S4 = parasympathetic outflow (bladder/bowel)",relations:["L5 vertebra","Ilium","Coccyx","Sacroiliac joint"],clinical:"Sacral insufficiency fractures in osteoporotic elderly. S2-S4 parasympathetics: bladder/bowel control. Lumbosacral angle vulnerable to spondylolysis.",memo:"'S2,3,4 keep the floor off the floor' — pelvic floor innervation"},
  {id:"sternum",name:"Sternum",latin:"Sternum",sys:"skeletal",region:"Thorax",type:"bone",desc:"Flat bone in anterior thoracic wall. Three parts: manubrium, body, xiphoid. Manubriosternal junction = sternal angle (Louis angle).",fn:"Rib attachment, mediastinal protection, haematopoiesis",blood:null,nerve:null,relations:["Ribs","Clavicle","Heart","Great vessels"],clinical:"Sternal angle (T4/5): aortic arch, tracheal bifurcation, azygos vein. Bone marrow biopsy site. Sternotomy for cardiac surgery. CPR over lower sternum.",memo:"'Sternal Angle = T4 = Aortic Arch Angles Away'"},
  {id:"ribs",name:"Ribs (Costae)",latin:"Costae",sys:"skeletal",region:"Thorax",type:"bone",desc:"12 pairs. True ribs 1-7: direct sternal articulation. False ribs 8-10: via rib 7 cartilage. Floating 11-12: no anterior attachment.",fn:"Thoracic cage integrity, respiratory mechanics, organ protection",blood:"Posterior intercostal arteries (aorta), anterior intercostal (internal thoracic)",nerve:"Intercostal nerves run in costal groove (inferior border)",relations:["Sternum","Thoracic vertebrae","Diaphragm","Lungs"],clinical:"Fractured at angle (weakest). Rib 1 related to subclavian vessels and brachial plexus. Flail chest: 3+ consecutive ribs broken at 2+ places. 'Safe' intercostal insertion above rib (NVB below).",memo:"'True 1-7, False 8-10, Floating 11-12'"},
  {id:"clavicle",name:"Clavicle",latin:"Clavicula",sys:"skeletal",region:"Upper limb",type:"bone",desc:"S-shaped long bone. Only bony connection between upper limb and axial skeleton. Articulates with sternum and acromion.",fn:"Transmits forces from upper limb to axial skeleton, struts shoulder",blood:"Thoracoacromial artery",nerve:null,relations:["SCJ","ACJ","Subclavian vessels","Brachial plexus"],clinical:"Most commonly fractured bone. Middle third most common. FOOSH mechanism. Subclavian vessels and brachial plexus posterior. ACJ dislocation grades I-VI.",memo:"'Strut of the Shoulder — Clavicle Connects'"},
  {id:"scapula",name:"Scapula",latin:"Scapula",sys:"skeletal",region:"Upper limb",type:"bone",desc:"Flat triangular shoulder blade. Glenoid cavity (shoulder socket), acromion, coracoid process, spine. 17 muscle attachments.",fn:"17 muscle attachments, forms glenohumeral joint socket",blood:null,nerve:"Long thoracic nerve to serratus anterior",relations:["Humerus","Clavicle","Serratus anterior","Rotator cuff"],clinical:"Winging of scapula = long thoracic nerve (C5,6,7) injury → serratus anterior paralysis. Glenoid is shallow → mobility but poor stability. Snapping scapula syndrome.",memo:"SALT: Serratus Anterior Long Thoracic nerve"},
  {id:"humerus",name:"Humerus",latin:"Humerus",sys:"skeletal",region:"Upper limb",type:"bone",desc:"Long bone of upper arm. Proximal: head, anatomical/surgical neck, greater/lesser tubercles. Shaft: deltoid tuberosity, radial groove. Distal: capitulum, trochlea, medial/lateral epicondyles.",fn:"Upper arm structure, proximal and distal joint formation",blood:"Anterior + posterior humeral circumflex arteries",nerve:"Radial nerve in spiral groove; axillary nerve at surgical neck",relations:["Shoulder joint","Elbow","Rotator cuff","Radial nerve"],clinical:"Surgical neck fracture → axillary nerve injury (deltoid paralysis). Radial groove fracture → radial nerve palsy (wrist drop). Lateral epicondyle = Tennis elbow. Medial epicondyle = Golfer's elbow.",memo:"'Saturday Night Palsy' from radial nerve compression in spiral groove"},
  {id:"radius",name:"Radius",latin:"Radius",sys:"skeletal",region:"Upper limb",type:"bone",desc:"Lateral forearm bone. Articulates with humerus (capitulum), ulna (proximal/distal radioulnar joints), and carpal bones distally.",fn:"Forearm rotation, wrist joint formation",blood:null,nerve:null,relations:["Humerus","Ulna","Carpal bones","Radial artery"],clinical:"Colles' fracture: distal radius, dorsal displacement (elderly, FOOSH) = 'dinner fork' deformity. Smith's fracture: volar displacement. Monteggia: proximal ulna + radial head dislocation.",memo:"'Colles = dinner fork deformity (dorsal)' vs 'Smith = reversed Colles (volar)'"},
  {id:"ulna",name:"Ulna",latin:"Ulna",sys:"skeletal",region:"Upper limb",type:"bone",desc:"Medial forearm bone. Olecranon (posterior elbow), coronoid process, trochlear notch. Main weight-bearing articulation at elbow.",fn:"Elbow joint formation, forearm stability",blood:null,nerve:"Ulnar nerve in posterior medial epicondyle groove",relations:["Humerus","Radius","Ulnar nerve"],clinical:"Olecranon fracture: fall on flexed elbow. Monteggia: proximal ulna + radial head dislocation. Galeazzi: distal radius + distal radioulnar joint. Ulnar nerve at medial epicondyle (funny bone).",memo:null},
  {id:"carpals",name:"Carpal Bones",latin:"Ossa carpi",sys:"skeletal",region:"Upper limb",type:"bone",desc:"8 bones in 2 rows. Proximal row (lateral-medial): Scaphoid, Lunate, Triquetrum, Pisiform. Distal row: Trapezium, Trapezoid, Capitate, Hamate.",fn:"Wrist flexibility, force transmission from hand to forearm",blood:"Scaphoid: branches of radial artery (vulnerable to AVN)",nerve:null,relations:["Carpal tunnel","Median nerve","Ulnar nerve"],clinical:"Scaphoid most commonly fractured — FOOSH, wrist dorsiflexion. X-ray initially normal. Proximal fragment AVN. Lunate dislocation: median nerve compression.",memo:"She Looks Too Pretty, Try To Catch Her = Scaphoid, Lunate, Triquetrum, Pisiform, Trapezium, Trapezoid, Capitate, Hamate"},
  {id:"femur",name:"Femur",latin:"Femur",sys:"skeletal",region:"Lower limb",type:"bone",desc:"Longest, heaviest, strongest bone. Head, neck (125° to shaft), greater/lesser trochanters, shaft, medial/lateral condyles.",fn:"Lower limb weight-bearing, hip and knee joint formation",blood:"Medial/lateral circumflex femoral arteries. Neck: retinacular arteries",nerve:"Periosteum: femoral, obturator, sciatic nerves",relations:["Hip joint","Knee joint","Femoral vessels","Sciatic nerve"],clinical:"Neck of femur fracture: osteoporotic elderly women. Intracapsular: AVN risk (retinacular arteries disrupted). Extracapsular: better prognosis. Coxa valga >135°; coxa vara <120°.",memo:"'Intra-capsular = AVN risk, Extra-capsular = Extra forgiving'"},
  {id:"patella",name:"Patella",latin:"Patella",sys:"skeletal",region:"Lower limb",type:"bone",desc:"Largest sesamoid bone. Develops in quadriceps tendon. Articulates with trochlear groove of femur.",fn:"Protects knee, increases mechanical advantage of quadriceps by 30-50%",blood:"Peripatellar anastomosis",nerve:null,relations:["Quadriceps","Patellar tendon","Femoral trochlea"],clinical:"Patellar dislocation: lateral in 95%. Predisposed by valgus, weak VMO, trochlear dysplasia. J-sign. Fracture: direct trauma or forceful quadriceps contraction.",memo:"'Patella = Protects the knee + Promotes quads power'"},
  {id:"tibia",name:"Tibia",latin:"Tibia",sys:"skeletal",region:"Lower limb",type:"bone",desc:"Medial leg bone. Tibial plateau, tibial tuberosity, anterior border (shin), medial malleolus distally.",fn:"Main weight-bearing bone of leg (83% of load)",blood:"Anterior and posterior tibial arteries",nerve:null,relations:["Femur","Fibula","Ankle joint","Common fibular nerve"],clinical:"Tibial plateau fractures: valgus/varus + axial load. Compartment syndrome: swollen tight leg = surgical emergency. Medial malleolus fracture in ankle injuries. Tibial shaft stress fractures in athletes.",memo:"Ottawa Rules for ankle X-ray: bone tenderness at malleoli or inability to weight-bear"},
  {id:"fibula",name:"Fibula",latin:"Fibula",sys:"skeletal",region:"Lower limb",type:"bone",desc:"Lateral leg bone — not weight-bearing (17%). Head at knee, lateral malleolus at ankle.",fn:"Ankle stability, muscle attachment",blood:null,nerve:"Common fibular nerve wraps around fibular head",relations:["Tibia","Ankle joint","Common fibular nerve","Lateral malleolus"],clinical:"Common fibular nerve at fibular head: cast pressure, cross-legged sitting → foot drop (dorsiflexion loss). Fibular free flap for jaw reconstruction. Lateral malleolus fracture in ankle sprains.",memo:"Common fibular nerve 'Wraps around the neck of the fibula = foot drop risk'"},
  {id:"tarsals",name:"Tarsal Bones",latin:"Ossa tarsi",sys:"skeletal",region:"Lower limb",type:"bone",desc:"7 bones: Calcaneus (largest), Talus, Navicular, Cuboid, Medial/Intermediate/Lateral Cuneiforms.",fn:"Foot arch support, ankle and foot movement",blood:null,nerve:null,relations:["Ankle joint","Midfoot joints","Lisfranc joint"],clinical:"Talus fractures: AVN risk (retrograde blood supply). Calcaneal fracture: axial load from height (lover's fracture). Lisfranc injury: tarsometatarsal fracture-dislocation (subtle on X-ray).",memo:"'The Cuneiform Cities Never Crash Tangoing' = Talus, Calcaneus, Navicular, Cuboid, Cuneiforms"},
  {id:"pelvis",name:"Pelvis",latin:"Pelvis",sys:"skeletal",region:"Lower limb",type:"bone",desc:"Ring: 2 hip bones (ilium + ischium + pubis fused at acetabulum) + sacrum + coccyx. Greater (false) pelvis above pelvic brim, lesser (true) pelvis below.",fn:"Supports abdominal viscera, transmits weight to lower limbs",blood:null,nerve:null,relations:["Hip joints","Sacroiliac joints","Bladder","Uterus/Prostate"],clinical:"Pelvic fractures: massive haemorrhage up to 4L. Female pelvis: wider, gynecoid. Male: android, narrower. Pelvic brim = obstetric inlet. Straddle injury: pubic rami fractures + urethral injury.",memo:"Acetabulum = 'vinegar cup' (Latin) — socket for femoral head"},

  // NERVOUS
  {id:"brain",name:"Brain",latin:"Encephalon",sys:"nervous",region:"Head",type:"organ",desc:"Central nervous system. ~1.4kg. Cerebrum (higher functions), cerebellum (coordination), brainstem (vital functions). 86 billion neurons.",fn:"Cognition, motor control, sensory processing, autonomic regulation, memory, emotion",blood:"Circle of Willis: ACA, MCA, PCA from internal carotids and vertebrobasilar system",nerve:null,relations:["Skull","Meninges","CSF","Cranial nerves","Spinal cord"],clinical:"Stroke FAST. Anterior MCA = contralateral hemiplegia (arm > leg), aphasia if dominant. Posterior = diplopia, vertigo, ataxia. Cushing's triad (raised ICP): HTN, bradycardia, irregular breathing.",memo:"Circle of Willis: 'A PAIR Of Mighty Bright Cerebral Arteries' (ACA, PCOM, MCA, Basilar, PICA etc.)"},
  {id:"spinal-cord",name:"Spinal Cord",latin:"Medulla spinalis",sys:"nervous",region:"Back",type:"organ",desc:"Extends foramen magnum to L1/L2 (conus medullaris). Grey matter (H-shaped) surrounded by white matter tracts. Cauda equina below L2.",fn:"Conducts sensory to brain, motor from brain, spinal reflexes",blood:"Anterior spinal artery (1 vessel), posterior spinal arteries (2 vessels)",nerve:null,relations:["Vertebral column","Cauda equina","Meninges"],clinical:"Complete lesion: below level, total motor + sensory loss. Brown-Séquard: ipsilateral motor + proprioception loss, contralateral pain/temp loss. Central cord: upper > lower limb weakness. LP at L3-4 or L4-5.",memo:"Anterior cord: no anterior tracts = no motor, no pain. Posterior intact = proprioception preserved"},

  // CARDIOVASCULAR
  {id:"heart",name:"Heart",latin:"Cor",sys:"cardiovascular",region:"Thorax",type:"organ",desc:"4-chambered pump. Pericardial sac, middle mediastinum. Right: deoxygenated → pulmonary. Left: oxygenated → systemic. 250-350g.",fn:"Pumps ~5L/min rest, up to 25L/min exercise. CO = HR × SV",blood:"Left (LAD + LCx) and Right coronary arteries",nerve:"Autonomic: sympathetic (T1-T5) + parasympathetic (vagus)",relations:["Lungs","Pericardium","Aorta","Pulmonary vessels","Oesophagus"],clinical:"STEMI territories: V1-V4=LAD (anterior), II/III/aVF=RCA (inferior), I/aVL/V5-V6=LCx (lateral). Starling's law: preload → stroke volume. Murmurs: AS (ejection systolic, carotids), MR (pansystolic, axilla).",memo:"Coronary: LAD = Left Anterior Descending = 'Widow Maker'"},
  {id:"aorta",name:"Aorta",latin:"Aorta",sys:"cardiovascular",region:"Thorax/Abdomen",type:"vessel",desc:"Largest artery. Ascending → arch (T4 sternal angle) → descending thoracic → abdominal (T12-L4). Normal diameter <3cm.",fn:"Distributes oxygenated blood to all systemic vessels",blood:null,nerve:null,relations:["Heart","Coronary arteries","Brachiocephalic trunk","Iliac arteries"],clinical:"Aortic dissection: tearing inter-scapular pain, BP difference between arms. Stanford A (ascending) = emergency surgery. Stanford B = medical. AAA repair if >5.5cm. Marfan's predisposes.",memo:"Stanford A = Ascending = surgery. Stanford B = Below ligamentum arteriosum = medical"},
];

async function main() {
  console.log('Seeding Atlas data...');

  for (const sys of SYSTEMS) {
    await prisma.atlasSystem.upsert({
      where: { systemId: sys.id },
      update: {
        label: sys.label,
        color: sys.color,
        border: sys.border,
        iconColor: sys.iconColor,
        iconName: sys.iconName,
        desc: sys.desc,
      },
      create: {
        systemId: sys.id,
        label: sys.label,
        color: sys.color,
        border: sys.border,
        iconColor: sys.iconColor,
        iconName: sys.iconName,
        desc: sys.desc,
      },
    });
  }

  for (const organ of DB) {
    await prisma.atlasStructure.upsert({
      where: { slug: organ.id },
      update: {
        name: organ.name,
        latin: organ.latin,
        type: organ.type,
        desc: organ.desc,
        region: organ.region,
        systemId: organ.sys,
        fn: organ.fn,
        blood: organ.blood,
        nerve: organ.nerve,
        relations: organ.relations,
        clinical: organ.clinical,
        memo: organ.memo,
      },
      create: {
        slug: organ.id,
        name: organ.name,
        latin: organ.latin,
        type: organ.type,
        desc: organ.desc,
        region: organ.region,
        systemId: organ.sys,
        fn: organ.fn,
        blood: organ.blood,
        nerve: organ.nerve,
        relations: organ.relations,
        clinical: organ.clinical,
        memo: organ.memo,
      },
    });
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
