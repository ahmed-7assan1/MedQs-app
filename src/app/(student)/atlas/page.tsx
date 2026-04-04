"use client";
import { useState, useMemo } from "react";
import { Search, X, ChevronRight, Info, ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const SYSTEMS = [
  { id: "skeletal",       label: "Skeletal",       color: "#3b82f6", emoji: "🦴" },
  { id: "muscular",       label: "Muscular",       color: "#ef4444", emoji: "💪" },
  { id: "nervous",        label: "Nervous",        color: "#8b5cf6", emoji: "🧠" },
  { id: "cardiovascular", label: "Cardiovascular", color: "#f43f5e", emoji: "❤️" },
  { id: "respiratory",    label: "Respiratory",    color: "#06b6d4", emoji: "🫁" },
  { id: "digestive",      label: "Digestive",      color: "#f59e0b", emoji: "🫃" },
  { id: "endocrine",      label: "Endocrine",      color: "#10b981", emoji: "⚗️" },
  { id: "urinary",        label: "Urinary",        color: "#f97316", emoji: "🫘" },
  { id: "lymphatic",      label: "Lymphatic",      color: "#14b8a6", emoji: "🛡️" },
  { id: "special_senses", label: "Special Senses", color: "#a78bfa", emoji: "👁️" },
];

const TYPE_COLORS = {
  bone:     { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-400" },
  muscle:   { bg: "bg-red-100 dark:bg-red-900/30",      text: "text-red-700 dark:text-red-400" },
  nerve:    { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  organ:    { bg: "bg-pink-100 dark:bg-pink-900/30",    text: "text-pink-700 dark:text-pink-400" },
  vessel:   { bg: "bg-rose-100 dark:bg-rose-900/30",    text: "text-rose-700 dark:text-rose-400" },
  joint:    { bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-400" },
  ligament: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  gland:    { bg: "bg-green-100 dark:bg-green-900/30",  text: "text-green-700 dark:text-green-400" },
  special:  { bg: "bg-teal-100 dark:bg-teal-900/30",    text: "text-teal-700 dark:text-teal-400" },
} as const;

type AtlasTypeKey = keyof typeof TYPE_COLORS;

function atlasTypeStyle(type: string) {
  const k = type as AtlasTypeKey;
  return k in TYPE_COLORS ? TYPE_COLORS[k] : TYPE_COLORS.organ;
}

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

  // MUSCULAR
  {id:"deltoid",name:"Deltoid",latin:"Musculus deltoideus",sys:"muscular",region:"Shoulder",type:"muscle",desc:"Triangular multipennate muscle. Three parts: anterior, middle, posterior.",fn:"Middle: abducts arm 15-90°. Anterior: flexion + medial rotation. Posterior: extension + lateral rotation.",blood:"Anterior/posterior humeral circumflex, thoracoacromial arteries",nerve:"Axillary nerve (C5, C6)",relations:["Humerus","Axillary nerve","Rotator cuff"],clinical:"Axillary nerve palsy: flat shoulder, atrophied deltoid, loss of 'regimental badge' sensation. Tested by holding arm lateral at side.",memo:"Axillary nerve C5,C6: 'High Five, Six' — shoulder level"},
  {id:"rotator-cuff",name:"Rotator Cuff",latin:null,sys:"muscular",region:"Shoulder",type:"muscle",desc:"SITS: Supraspinatus, Infraspinatus, Teres minor, Subscapularis. Blend with glenohumeral joint capsule.",fn:"Supraspinatus: initiates abduction 0-15°. Infraspinatus + Teres minor: lateral rotation. Subscapularis: medial rotation.",blood:"Suprascapular and posterior humeral circumflex arteries",nerve:"Supraspinatus + Infraspinatus: suprascapular nerve. Teres minor: axillary. Subscapularis: upper + lower subscapular nerves.",relations:["Glenohumeral joint","Subacromial space","Coracoacromial arch"],clinical:"Supraspinatus most commonly torn (impingement). Painful arc 60-120°. Empty can test. Gerber's lift-off for subscapularis. Drop arm sign for complete tear.",memo:"SITS: 'Sleeping In The Snow' — Supraspinatus, Infraspinatus, Teres minor, Subscapularis"},
  {id:"biceps-brachii",name:"Biceps Brachii",latin:"Musculus biceps brachii",sys:"muscular",region:"Upper limb",type:"muscle",desc:"Two heads: long (supraglenoid tubercle) and short (coracoid process). Inserts into radial tuberosity and bicipital aponeurosis.",fn:"Elbow flexion, forearm supination (strongest supinator), weak shoulder flexion",blood:"Brachial artery branches",nerve:"Musculocutaneous nerve (C5, C6)",relations:["Brachialis","Coracobrachialis","Musculocutaneous nerve"],clinical:"Long head tendon rupture: 'Popeye deformity'. Bicipital tendinopathy from overhead activities. Speed's test: anterior shoulder pain on resisted elbow flexion.",memo:"'Biceps Bends and Supinates' — musculocutaneous C5,6"},
  {id:"triceps-brachii",name:"Triceps Brachii",latin:"Musculus triceps brachii",sys:"muscular",region:"Upper limb",type:"muscle",desc:"Three heads: long (infraglenoid tubercle), medial, lateral. Only posterior arm compartment muscle.",fn:"Elbow extension (only extensor). Long head extends + adducts shoulder.",blood:"Profunda brachii artery",nerve:"Radial nerve (C6, C7, C8)",relations:["Radial nerve","Spiral groove","Olecranon"],clinical:"Radial nerve spiral groove: triceps spared (branch given off before groove) but wrist/finger extensors lost → wrist drop. Triceps tendon rupture: rare, anabolic steroid use.",memo:"'TRiCePS = TRiple elbow extensors, Radial nerve'"},
  {id:"quadriceps",name:"Quadriceps Femoris",latin:null,sys:"muscular",region:"Lower limb",type:"muscle",desc:"4 muscles: Rectus femoris (only bi-articular crossing hip), Vastus lateralis, Vastus medialis, Vastus intermedius. Largest muscle mass in body.",fn:"Knee extension (all 4). Rectus femoris: hip flexion. VMO: last 15° extension, patellar stabilisation.",blood:"Femoral artery branches",nerve:"Femoral nerve (L2, L3, L4)",relations:["Patella","Patellar tendon","Femoral nerve"],clinical:"Knee buckles on stairs = quadriceps weakness. VMO wasting in knee OA. Quadriceps tendon rupture: sudden pop, cannot extend knee.",memo:"Quadriceps = Femoral Nerve (L2,3,4) = 4 muscles"},
  {id:"hamstrings",name:"Hamstrings",latin:null,sys:"muscular",region:"Lower limb",type:"muscle",desc:"Semitendinosus, Semimembranosus, Biceps femoris (long + short head). Most from ischial tuberosity except biceps short head (linea aspera).",fn:"Knee flexion. Hip extension. Medial rotation of knee in flexion (semi- muscles).",blood:"Perforating branches of profunda femoris",nerve:"Sciatic nerve (tibial division L5,S1,S2). Biceps short head: common fibular division.",relations:["Sciatic nerve","Ischial tuberosity","Posterior thigh"],clinical:"Hamstring strain: commonest muscle injury in sprinters. Proximal avulsion from ischial tuberosity. Used as ACL reconstruction graft.",memo:"Medial = Semi- muscles (semitendinosus, semimembranosus). Lateral = Biceps femoris"},
  {id:"diaphragm",name:"Diaphragm",latin:"Diaphragma",sys:"muscular",region:"Thorax",type:"muscle",desc:"Dome-shaped musculotendinous septum separating thorax from abdomen. Three major apertures: T8 IVC, T10 oesophagus+vagus, T12 aorta+azygos+thoracic duct.",fn:"Primary muscle of respiration — inspiration = contraction, dome flattens",blood:"Inferior phrenic arteries, musculophrenic artery",nerve:"Phrenic nerve (C3, C4, C5) — motor and sensory to central tendon",relations:["Lungs","Liver","Stomach","Oesophagus","Aorta","IVC"],clinical:"Referred pain → tip of shoulder (C3,4,5). Hiatus hernia: stomach through oesophageal hiatus. Congenital diaphragmatic hernia: Bochdalek (posterolateral, left > right).",memo:"'I 8 Ten Eggs At Twelve' = IVC at T8, Oesophagus at T10, Aorta at T12"},
  {id:"gastrocnemius",name:"Gastrocnemius",latin:"Musculus gastrocnemius",sys:"muscular",region:"Lower limb",type:"muscle",desc:"Two heads from femoral condyles. Forms Achilles tendon with soleus, inserting into calcaneal tuberosity.",fn:"Plantarflexion, knee flexion. Important in walking, running, jumping.",blood:"Sural arteries",nerve:"Tibial nerve (S1, S2)",relations:["Soleus","Achilles tendon","Sural nerve"],clinical:"Achilles rupture: 'felt like a kick', Thompson's test positive. Medial head: tennis leg tear. Sural nerve runs between heads.",memo:"Thompson's test: squeeze calf = plantarflexion if intact"},
  {id:"iliopsoas",name:"Iliopsoas",latin:null,sys:"muscular",region:"Hip",type:"muscle",desc:"Combined iliacus (iliac fossa) + psoas major (T12-L5). Insert on lesser trochanter.",fn:"Strongest hip flexor, external rotation of hip, spinal flexion (psoas)",blood:"Iliac branches, lumbar arteries",nerve:"Femoral nerve (L1, L2, L3). Psoas: direct branches L1-L3.",relations:["Femoral nerve","Lesser trochanter","Inguinal ligament","Lumbar vertebrae"],clinical:"Psoas abscess: disc infection → pus tracks to psoas → groin mass. Iliopsoas bursitis. Thomas test for hip flexor contracture.",memo:"Hip flexors shortened in prolonged sitting — stretching important"},

  // NERVOUS
  {id:"brain",name:"Brain",latin:"Encephalon",sys:"nervous",region:"Head",type:"organ",desc:"Central nervous system. ~1.4kg. Cerebrum (higher functions), cerebellum (coordination), brainstem (vital functions). 86 billion neurons.",fn:"Cognition, motor control, sensory processing, autonomic regulation, memory, emotion",blood:"Circle of Willis: ACA, MCA, PCA from internal carotids and vertebrobasilar system",nerve:null,relations:["Skull","Meninges","CSF","Cranial nerves","Spinal cord"],clinical:"Stroke FAST. Anterior MCA = contralateral hemiplegia (arm > leg), aphasia if dominant. Posterior = diplopia, vertigo, ataxia. Cushing's triad (raised ICP): HTN, bradycardia, irregular breathing.",memo:"Circle of Willis: 'A PAIR Of Mighty Bright Cerebral Arteries' (ACA, PCOM, MCA, Basilar, PICA etc.)"},
  {id:"spinal-cord",name:"Spinal Cord",latin:"Medulla spinalis",sys:"nervous",region:"Back",type:"organ",desc:"Extends foramen magnum to L1/L2 (conus medullaris). Grey matter (H-shaped) surrounded by white matter tracts. Cauda equina below L2.",fn:"Conducts sensory to brain, motor from brain, spinal reflexes",blood:"Anterior spinal artery (1 vessel), posterior spinal arteries (2 vessels)",nerve:null,relations:["Vertebral column","Cauda equina","Meninges"],clinical:"Complete lesion: below level, total motor + sensory loss. Brown-Séquard: ipsilateral motor + proprioception loss, contralateral pain/temp loss. Central cord: upper > lower limb weakness. LP at L3-4 or L4-5.",memo:"Anterior cord: no anterior tracts = no motor, no pain. Posterior intact = proprioception preserved"},
  {id:"brachial-plexus",name:"Brachial Plexus",latin:null,sys:"nervous",region:"Neck/Shoulder",type:"nerve",desc:"Roots C5-T1. Roots → 3 trunks (upper/middle/lower) → 6 divisions → 3 cords (posterior/lateral/medial) → 5 terminal branches.",fn:"Motor and sensory supply to entire upper limb",blood:null,nerve:"C5, C6, C7, C8, T1 nerve roots",relations:["Scalene muscles","Subclavian artery","Cervical ribs"],clinical:"Erb's palsy (C5,C6): waiter's tip — adducted, internally rotated, elbow extended. Klumpke's (C8,T1): claw hand, Horner's. Thoracic outlet syndrome.",memo:"Terminal branches: 'My Aunt Raped My Uncle' = Musculocutaneous, Axillary, Radial, Median, Ulnar"},
  {id:"femoral-nerve",name:"Femoral Nerve",latin:"Nervus femoralis",sys:"nervous",region:"Lower limb",type:"nerve",desc:"Largest branch of lumbar plexus (L2-L4). Passes under inguinal ligament lateral to femoral artery in femoral triangle.",fn:"Motor: quadriceps, sartorius, pectineus. Sensory: anterior thigh, medial leg (via saphenous nerve).",blood:null,nerve:"L2, L3, L4",relations:["Femoral triangle","Inguinal ligament","Femoral artery"],clinical:"Damaged in hip fractures, lithotomy position, pelvic surgery. Presents: weak knee extension, absent knee jerk, wasted quadriceps. Femoral nerve stretch test for L2-4 disc disease.",memo:"Femoral triangle NAVEL (lateral to medial): Nerve, Artery, Vein, Empty canal, Lymphatics"},
  {id:"sciatic-nerve",name:"Sciatic Nerve",latin:"Nervus ischiadicus",sys:"nervous",region:"Lower limb",type:"nerve",desc:"Largest nerve in body (width of a thumb). L4-S3. Exits pelvis via greater sciatic foramen below piriformis. Divides into tibial + common fibular nerves at popliteal fossa.",fn:"Motor: hamstrings, all muscles below knee. Sensory: posterior thigh, entire leg/foot (except medial via saphenous).",blood:null,nerve:"L4, L5, S1, S2, S3",relations:["Piriformis","Greater sciatic foramen","Popliteal fossa"],clinical:"Hip replacement risk (posterior approach). Piriformis syndrome: sciatica. Disc herniation L4/5 or L5/S1. L4 lesion: weak quadriceps, absent knee jerk. L5: weak foot dorsiflexion, eversion. S1: absent ankle jerk.",memo:"SLR positive: pain before 70° = disc herniation. 'Crossed SLR': pain in affected leg when other leg raised = central disc"},
  {id:"median-nerve",name:"Median Nerve",latin:"Nervus medianus",sys:"nervous",region:"Upper limb",type:"nerve",desc:"C6-T1. Runs through forearm between FDS and FDP, enters carpal tunnel.",fn:"Motor: LOAF (L1,L2 lumbricals, Opponens pollicis, Abductor pollicis brevis, Flexor pollicis brevis), most flexors. Sensory: lateral 3.5 fingers.",blood:null,nerve:"C6, C7, C8, T1",relations:["Carpal tunnel","Thenar muscles","Pronator teres"],clinical:"Carpal tunnel syndrome: nocturnal paraesthesia thumb/index/middle, thenar wasting, Tinel's, Phalen's. Associations: pregnancy, hypothyroidism, DM, RA. Anterior interosseous nerve: can't make OK sign.",memo:"'LOAF' = Lumbricals 1+2, Opponens pollicis, Abductor pollicis brevis, Flexor pollicis brevis"},
  {id:"ulnar-nerve",name:"Ulnar Nerve",latin:"Nervus ulnaris",sys:"nervous",region:"Upper limb",type:"nerve",desc:"C7-T1. Runs posterior to medial epicondyle (cubital tunnel). Passes through Guyon's canal at wrist.",fn:"Motor: hypothenar muscles, adductor pollicis, medial 2 lumbricals, all interossei, FCU, medial FDP. Sensory: medial 1.5 fingers.",blood:null,nerve:"C7, C8, T1",relations:["Medial epicondyle","Guyon's canal","Hypothenar muscles"],clinical:"Cubital tunnel syndrome: ring/little finger numbness, claw hand (ulnar paradox: worse with wrist lesion). Froment's sign (key pinch). Cyclist's palsy: Guyon's canal compression.",memo:"Ulnar claw: ring + little fingers (ulnar two). 'Ulnar paradox: more distal lesion = worse claw'"},
  {id:"radial-nerve",name:"Radial Nerve",latin:"Nervus radialis",sys:"nervous",region:"Upper limb",type:"nerve",desc:"C5-T1. Largest branch of posterior cord. Passes spiral groove of humerus, divides into deep (posterior interosseous nerve) and superficial branches at lateral epicondyle.",fn:"Motor: triceps, brachioradialis, all wrist/finger extensors. Sensory: posterior arm, posterior forearm, anatomical snuffbox.",blood:null,nerve:"C5, C6, C7, C8, T1",relations:["Spiral groove","Lateral epicondyle","Anatomical snuffbox"],clinical:"Saturday night palsy: compression in spiral groove → wrist drop. Mid-shaft humeral fracture. PIN at arcade of Frohse → finger drop, wrist extends radially.",memo:"Radial nerve = Posterior Cord → Posterior compartments → Wrist/finger extension. ABCDE: Axillary → Brachial → spiral groove → Cubital → Deep (PIN)"},
  {id:"cn-vii",name:"Facial Nerve (CN VII)",latin:"Nervus facialis",sys:"nervous",region:"Head",type:"nerve",desc:"Mixed nerve. CPA angle → temporal bone (facial canal) → stylomastoid foramen. 5 terminal branches: temporal, zygomatic, buccal, marginal mandibular, cervical.",fn:"Motor: facial expression muscles, stapedius, posterior digastric. Sensory: taste anterior 2/3 tongue (chorda tympani). Parasympathetic: lacrimal, submandibular, sublingual glands.",blood:null,nerve:"CPA, temporal bone, stylomastoid foramen",relations:["Cerebellopontine angle","Parotid gland","Middle ear"],clinical:"Bell's palsy: unilateral LMN (forehead involved). UMN lesion (stroke): forehead spared (bilateral cortical representation). Ramsay Hunt: herpes zoster, ear vesicles. Parotid surgery risk.",memo:"'To Zanzibar By Motor Car' = Temporal, Zygomatic, Buccal, Marginal mandibular, Cervical"},
  {id:"vagus-nerve",name:"Vagus Nerve (CN X)",latin:"Nervus vagus",sys:"nervous",region:"Thorax/Abdomen",type:"nerve",desc:"Longest cranial nerve. Jugular foramen → carotid sheath → thorax → abdomen. Branches: pharyngeal, superior/recurrent laryngeal, cardiac, pulmonary, oesophageal, gastric.",fn:"Motor: pharynx/larynx. Parasympathetic: heart, lungs, gut to splenic flexure. Sensory: visceral organs.",blood:null,nerve:"CN X — exits via jugular foramen",relations:["Carotid sheath","Aortic arch (left RLN)","Oesophagus","Stomach"],clinical:"Left RLN loops under aortic arch → hoarse voice in lung Ca, aortic aneurysm, enlarged nodes. Vasovagal syncope. Vagotomy for peptic ulcer (historical).",memo:"'Left RLN = Lung cancer until proven otherwise'"},

  // CARDIOVASCULAR
  {id:"heart",name:"Heart",latin:"Cor",sys:"cardiovascular",region:"Thorax",type:"organ",desc:"4-chambered pump. Pericardial sac, middle mediastinum. Right: deoxygenated → pulmonary. Left: oxygenated → systemic. 250-350g.",fn:"Pumps ~5L/min rest, up to 25L/min exercise. CO = HR × SV",blood:"Left (LAD + LCx) and Right coronary arteries",nerve:"Autonomic: sympathetic (T1-T5) + parasympathetic (vagus)",relations:["Lungs","Pericardium","Aorta","Pulmonary vessels","Oesophagus"],clinical:"STEMI territories: V1-V4=LAD (anterior), II/III/aVF=RCA (inferior), I/aVL/V5-V6=LCx (lateral). Starling's law: preload → stroke volume. Murmurs: AS (ejection systolic, carotids), MR (pansystolic, axilla).",memo:"Coronary: LAD = Left Anterior Descending = 'Widow Maker'"},
  {id:"aorta",name:"Aorta",latin:"Aorta",sys:"cardiovascular",region:"Thorax/Abdomen",type:"vessel",desc:"Largest artery. Ascending → arch (T4 sternal angle) → descending thoracic → abdominal (T12-L4). Normal diameter <3cm.",fn:"Distributes oxygenated blood to all systemic vessels",blood:null,nerve:null,relations:["Heart","Coronary arteries","Brachiocephalic trunk","Iliac arteries"],clinical:"Aortic dissection: tearing inter-scapular pain, BP difference between arms. Stanford A (ascending) = emergency surgery. Stanford B = medical. AAA repair if >5.5cm. Marfan's predisposes.",memo:"Stanford A = Ascending = surgery. Stanford B = Below ligamentum arteriosum = medical"},
  {id:"coronary-arteries",name:"Coronary Arteries",latin:null,sys:"cardiovascular",region:"Thorax",type:"vessel",desc:"LCA: left main → LAD (interventricular septum, anterior LV) + LCx (lateral/posterior LV). RCA: RV, inferior LV, SA/AV nodes in right-dominant.",fn:"Myocardial oxygen and nutrition delivery",blood:null,nerve:null,relations:["Aortic sinuses","Myocardium","SA node","AV node"],clinical:"Right-dominant (65%): posterior descending from RCA. LAD most commonly diseased. CABG: internal mammary artery + saphenous vein grafts. PCI for STEMI.",memo:"Dominance: right 65%, left 15%, co-dominant 20%"},
  {id:"carotid-arteries",name:"Carotid Arteries",latin:null,sys:"cardiovascular",region:"Neck",type:"vessel",desc:"Common carotid (L from aortic arch, R from brachiocephalic) divides at C3/4 → ICA (skull, no neck branches) + ECA (face/neck).",fn:"Blood supply to brain (ICA) and face/neck (ECA)",blood:null,nerve:null,relations:["Circle of Willis","Carotid sinus","Carotid body"],clinical:"Carotid bifurcation: carotid body (chemoreceptor) + carotid sinus (baroreceptor). >70% symptomatic stenosis: carotid endarterectomy. TIA/stroke from emboli.",memo:"ICA = Into Cranium Always. ECA = Everything external"},
  {id:"femoral-artery",name:"Femoral Artery",latin:null,sys:"cardiovascular",region:"Lower limb",type:"vessel",desc:"Continuation of external iliac below inguinal ligament. Femoral triangle → adductor canal → popliteal artery at adductor hiatus.",fn:"Main blood supply to lower limb",blood:null,nerve:null,relations:["Femoral vein","Femoral nerve","Profunda femoris"],clinical:"Femoral pulse: midpoint inguinal ligament. Femoral canal: medial to femoral vein = femoral hernia. Cardiac catheterisation site. Injury in knee dislocation.",memo:"Femoral triangle NAVEL: Nerve, Artery, Vein, Empty canal, Lymphatics"},
  {id:"portal-vein",name:"Portal Vein",latin:"Vena portae hepatis",sys:"cardiovascular",region:"Abdomen",type:"vessel",desc:"Formed by SMV + splenic vein behind neck of pancreas. Carries nutrient-rich gut blood to liver.",fn:"Nutrient transport from gut to liver, liver metabolism",blood:null,nerve:null,relations:["Superior mesenteric vein","Splenic vein","Liver","Head of pancreas"],clinical:"Portal hypertension >12mmHg: oesophageal varices, caput medusae, splenomegaly, ascites. Porto-systemic anastomoses. TIPS for refractory bleeding.",memo:"Porto-systemic anastomoses 'HOPE': Haemorrhoidal, Oesophageal, Para-umbilical, End-organ"},

  // RESPIRATORY
  {id:"lungs",name:"Lungs",latin:"Pulmones",sys:"respiratory",region:"Thorax",type:"organ",desc:"Right: 3 lobes (upper/middle/lower), 10 bronchopulmonary segments. Left: 2 lobes (upper with lingula/lower), 9 segments. Cardiac notch left side.",fn:"Gas exchange: O2 uptake, CO2 elimination. Surfactant prevents alveolar collapse.",blood:"Pulmonary arteries (gas exchange), bronchial arteries (nutrition)",nerve:"Pulmonary plexus (sympathetic + vagus)",relations:["Heart","Diaphragm","Mediastinum","Pleura"],clinical:"Aspiration: right bronchus more vertical → right lower lobe. Pneumothorax: hyperresonance, absent breath sounds, trachea deviates away (tension). Pleural effusion: stony dull. Consolidation: bronchial breathing, increased VF.",memo:"Right = 3 lobes. Left = 2 lobes (cardiac notch). Aspiration → right lower lobe"},
  {id:"trachea",name:"Trachea",latin:"Trachea",sys:"respiratory",region:"Neck/Thorax",type:"organ",desc:"16-20 C-shaped rings. C6 (cricoid) to T4/5 (carina). 10-15cm. Posterior membranous wall. Carina divides into main bronchi.",fn:"Conduit for airflow between larynx and bronchi",blood:null,nerve:null,relations:["Oesophagus","Thyroid","Aortic arch","Carina"],clinical:"Intubation: check bilateral breath sounds. Tracheal deviation: away from tension pneumothorax, towards collapse/fibrosis. Carina widening on CXR = left atrial enlargement.",memo:"Carina at T4 = 'C4rina = Remember 4' and sternal angle"},
  {id:"larynx",name:"Larynx",latin:"Larynx",sys:"respiratory",region:"Neck",type:"organ",desc:"C3-C6. Cartilages: thyroid (largest), cricoid (only complete ring), epiglottis, arytenoids. True and false vocal cords.",fn:"Phonation, airway protection (epiglottis), cough reflex",blood:"Superior and inferior laryngeal arteries",nerve:"Superior laryngeal (sensory above vocal cords + cricothyroid). RLN = all other intrinsic muscles.",relations:["Thyroid gland","Pharynx","Trachea","Recurrent laryngeal nerve"],clinical:"Croup: barking cough in children. Epiglottitis: stridor, drooling, tripod position (medical emergency). Cricothyroidotomy = emergency airway. Bilateral RLN palsy = stridor.",memo:"Cricothyroid membrane: 'can feel between the thyroid and cricoid cartilages — emergency airway access'"},

  // DIGESTIVE
  {id:"liver",name:"Liver",latin:"Hepar",sys:"digestive",region:"Abdomen",type:"organ",desc:"Largest internal organ (~1.5kg). Right hypochondrium to epigastrium. 8 Couinaud segments. Functional unit: hepatic lobule.",fn:"Metabolism, detoxification, bile production (500-1000mL/day), clotting factors, glycogen storage, albumin",blood:"Portal vein (75%, nutrient-rich) + Hepatic artery (25%, oxygenated). Venous: hepatic veins → IVC.",nerve:"Hepatic plexus (sympathetic)",relations:["Gallbladder","Portal vein","Biliary tree","Right kidney"],clinical:"Liver failure: jaundice, coagulopathy, encephalopathy, ascites. Child-Pugh/MELD. HCC on cirrhosis (AFP↑). Most common malignant = metastases. Kupffer cells = liver macrophages.",memo:"ABCDE liver failure: Albumin low, Bleeding (coagulopathy), Coma (encephalopathy), Distension (ascites), Encephalopathy"},
  {id:"stomach",name:"Stomach",latin:"Ventriculus",sys:"digestive",region:"Abdomen",type:"organ",desc:"J-shaped. Parts: fundus, body, antrum, pylorus. Rugae (mucosal folds). Between oesophagus and duodenum.",fn:"Mechanical digestion, pepsin, HCl (parietal cells), intrinsic factor (B12), gastrin (G cells)",blood:"Left gastric, right gastric, right gastroepiploic, short gastric arteries",nerve:"Vagus (parasympathetic), celiac plexus (sympathetic)",relations:["Oesophagus","Duodenum","Spleen","Diaphragm"],clinical:"Peptic ulcer: duodenal posterior = perforates gastroduodenal artery (haemorrhage). Anterior = peritonitis. Gastric cancer: leather bottle (linitis plastica). Virchow's node = left supraclavicular = gastric/pancreatic mets.",memo:"Intrinsic factor from Parietal cells = B12 absorption"},
  {id:"small-intestine",name:"Small Intestine",latin:"Intestinum tenue",sys:"digestive",region:"Abdomen",type:"organ",desc:"Duodenum (25cm, C-shaped, retroperitoneal), Jejunum (2.5m, thick walls, plicae circulares), Ileum (3.5m, Peyer's patches, terminal ileum absorbs B12 + bile salts).",fn:"Main site of digestion and absorption. Surface area ~200m² via villi + microvilli.",blood:"Superior mesenteric artery",nerve:"Enteric nervous system + vagus",relations:["Stomach","Large intestine","Mesentery","Superior mesenteric vessels"],clinical:"Terminal ileum: Crohn's, B12 malabsorption. Meckel's diverticulum: 2% population, 2ft from IC valve, 2in long, 2 types ectopic tissue. Small bowel obstruction: central laddering distension.",memo:"Meckel's 'Rule of 2s': 2%, 2ft from IC valve, 2in long, 2 tissue types, 2 years of life"},
  {id:"large-intestine",name:"Large Intestine",latin:"Intestinum crassum",sys:"digestive",region:"Abdomen",type:"organ",desc:"Caecum, appendix, ascending, hepatic flexure, transverse, splenic flexure, descending, sigmoid, rectum, anal canal. ~1.5m. Taenia coli visible.",fn:"Water/electrolyte absorption, gut flora, faeces formation",blood:"SMA (right/transverse), IMA (left/sigmoid/upper rectum)",nerve:"Autonomic",relations:["Small intestine","Liver","Spleen","Urinary bladder"],clinical:"Right colon Ca: iron deficiency anaemia. Left colon: obstruction, change in bowel habit. Diverticulae: sigmoid most common. UC: continuous from rectum. Crohn's: skip lesions, can affect any part.",memo:"Watershed areas: Splenic flexure (SMA/IMA junction) and rectosigmoid (IMA/pudendal)"},
  {id:"pancreas",name:"Pancreas",latin:"Pancreas",sys:"digestive",region:"Abdomen",type:"organ",desc:"Retroperitoneal. Head (duodenal C-loop), neck (over portal vein), body, tail (spleen). Exocrine: acini. Endocrine: Islets of Langerhans (α=glucagon, β=insulin, δ=somatostatin).",fn:"Exocrine: amylase, lipase, proteases. Endocrine: glucose regulation.",blood:"Head: superior/inferior pancreaticoduodenal. Body/tail: splenic artery.",nerve:"Splanchnic nerves, vagus",relations:["Duodenum","Portal vein","Splenic vessels","Bile duct"],clinical:"Pancreatitis: Gallstones + Alcohol (85%). Cullen's sign (periumbilical), Grey Turner's (flank) = retroperitoneal haemorrhage. Pancreatic Ca: 75% head, painless obstructive jaundice.",memo:"Acute pancreatitis: 'I GET SMASHED' = Idiopathic, Gallstones, Ethanol, Trauma, Steroids, Mumps, Autoimmune, Scorpion, Hyperlipidaemia, ERCP, Drugs"},
  {id:"appendix",name:"Appendix",latin:"Appendix vermiformis",sys:"digestive",region:"Abdomen",type:"organ",desc:"4-cm blind-ended tube from caecum at convergence of taenia coli. Position variable: retrocaecal (65%), pelvic, subcaecal.",fn:"Lymphoid tissue (MALT), gut microbiome reservoir",blood:"Appendicular artery (branch of ileocolic artery)",nerve:"Superior mesenteric plexus",relations:["Caecum","Terminal ileum","Ileocaecal valve"],clinical:"Appendicitis: periumbilical pain → RIF (McBurney's point: 1/3 ASIS to umbilicus). Rovsing's sign. Psoas sign (retrocaecal). Alvarado score ≥7 = high likelihood.",memo:"MANTRELS Alvarado score: Migration, Anorexia, Nausea, Tenderness RIF, Rebound, Elevated temp, Leukocytosis, Shift left"},

  // ENDOCRINE
  {id:"pituitary",name:"Pituitary Gland",latin:"Hypophysis",sys:"endocrine",region:"Head",type:"gland",desc:"Pea-sized, sella turcica of sphenoid. Anterior (adenohypophysis, 75%): GH, TSH, ACTH, FSH, LH, prolactin. Posterior (neurohypophysis): ADH, oxytocin.",fn:"Master gland — regulates other endocrine glands",blood:"Hypophyseal arteries",nerve:"Hypothalamus via pituitary stalk",relations:["Sella turcica","Optic chiasm","Cavernous sinus","Hypothalamus"],clinical:"Prolactinoma (commonest): galactorrhoea, amenorrhoea. Acromegaly (GH excess adults): enlarged hands/feet/jaw. Cushing's disease: ACTH from pit. adenoma. Bitemporal hemianopia from optic chiasm compression.",memo:"Anterior pituitary FLAT PiG: FSH, LH, ACTH, TSH, Prolactin, GH"},
  {id:"thyroid",name:"Thyroid Gland",latin:"Glandula thyroidea",sys:"endocrine",region:"Neck",type:"gland",desc:"Butterfly-shaped bilobar gland C5-T1, anterior to trachea. Two lobes + isthmus. Rich vascularity.",fn:"T3 and T4 (metabolism, growth, development). Calcitonin from C-cells.",blood:"Superior thyroid artery (ECA), inferior thyroid artery (thyrocervical trunk)",nerve:"Superior cervical ganglion (sympathetic)",relations:["Trachea","Parathyroid glands","Recurrent laryngeal nerve","Oesophagus"],clinical:"Hypothyroidism: lethargy, cold intolerance, constipation, bradycardia, myxoedema. Hyperthyroidism (Graves'): weight loss, palpitations, exophthalmos, pretibial myxoedema. Thyroidectomy: RLN injury (hoarse voice), parathyroid injury (hypocalcaemia).",memo:"Graves' = Goitre, Recurrence risk, Autoimmune, Von Basedow, Eye disease, Sweating"},
  {id:"adrenal",name:"Adrenal Glands",latin:"Glandulae suprarenales",sys:"endocrine",region:"Abdomen",type:"gland",desc:"Paired glands superior to kidneys. Cortex: zona glomerulosa (aldosterone), fasciculata (cortisol), reticularis (sex hormones). Medulla: adrenaline 80%, noradrenaline 20%.",fn:"Cortex: aldosterone, cortisol, androgens. Medulla: fight-or-flight response.",blood:"Superior (inferior phrenic), middle (aorta), inferior (renal) suprarenal arteries",nerve:"Greater splanchnic nerve → medulla (pre-ganglionic sympathetic)",relations:["Kidneys","IVC (right)","Aorta (left)","Diaphragm"],clinical:"Addison's: hypotension, hyperkalaemia, hyponatraemia, hypoglycaemia, bronzed skin. Cushing's: central obesity, buffalo hump, striae. Conn's: hypertension + hypokalaemia. Phaeochromocytoma: episodic HTN, headaches, sweating, palpitations.",memo:"Cortex layers GFR: Glomerulosa (salt), Fasciculata (sugar), Reticularis (sex)"},
  {id:"parathyroid",name:"Parathyroid Glands",latin:"Glandulae parathyroideae",sys:"endocrine",region:"Neck",type:"gland",desc:"4 small glands (2 superior, 2 inferior) on posterior thyroid. Superior from 4th pharyngeal pouch, inferior from 3rd (migrate further).",fn:"PTH: raises serum calcium (bone resorption, renal tubular reabsorption, activates vitamin D)",blood:"Inferior thyroid artery",nerve:null,relations:["Thyroid gland","RLN","Trachea"],clinical:"Primary hyperparathyroidism: 'bones, stones, groans, psychic moans' (hypercalcaemia). Hypoparathyroidism post-thyroidectomy: hypocalcaemia = tetany, Chvostek's sign, Trousseau's sign.",memo:"'Bones, Stones, Groans, Psychic Moans' = primary hyperparathyroidism"},

  // URINARY
  {id:"kidney",name:"Kidneys",latin:"Renes",sys:"urinary",region:"Abdomen",type:"organ",desc:"Paired retroperitoneal organs T12-L3. Right lower (liver). Bean-shaped, 10-12cm. Cortex (glomeruli, tubules) + medulla (loops, collecting ducts). ~1 million nephrons.",fn:"Filtration (170L/day, 1.5L excreted), BP regulation (RAAS/renin), EPO production, vitamin D activation",blood:"Renal arteries directly from aorta",nerve:"Renal plexus",relations:["Adrenal glands","Ureter","Renal vessels","Psoas muscle"],clinical:"Renal stones: calcium oxalate most common. Obstruction: PUJ, pelvic brim, VUJ. RCC: haematuria + loin pain + mass ('classic triad' in 10%). ADPKD: bilateral enlargement, berry aneurysms, hepatic cysts.",memo:"Ureteric narrowings PVV: Pelviureteric junction, Vascular crossing (pelvic brim), Vesicoureteric junction"},
  {id:"bladder",name:"Urinary Bladder",latin:"Vesica urinaria",sys:"urinary",region:"Pelvis",type:"organ",desc:"Hollow muscular organ. Trigone (internal urethral orifice + 2 ureteric orifices, no rugae). Detrusor muscle. Capacity 400-500mL.",fn:"Urine storage and micturition",blood:"Superior/inferior vesical arteries",nerve:"Detrusor: parasympathetic S2-S4. Internal sphincter: sympathetic. External sphincter: pudendal nerve (S2-S4, somatic).",relations:["Prostate (men)","Uterus (women)","Ureters","Urethra"],clinical:"TCC (90%): painless haematuria, smoking/aromatic amines risk. BPH: retention, residual volume. Neurogenic bladder: UMN = spastic (small, overactive); LMN = flaccid (large, underactive).",memo:"Trigone = most common site for bladder tumours"},

  // LYMPHATIC
  {id:"spleen",name:"Spleen",latin:"Lien",sys:"lymphatic",region:"Abdomen",type:"organ",desc:"Largest lymphoid organ. Left hypochondrium, ribs 9-11. Notched anterior border. Red pulp (blood filtration) + white pulp (immune).",fn:"Blood filtration (old RBCs), immune surveillance, platelet reservoir (1/3 of platelets), fetal haematopoiesis, IgM production",blood:"Splenic artery (from coeliac trunk). Venous: splenic vein → portal vein.",nerve:"Splenic plexus",relations:["Left kidney","Stomach","Tail of pancreas","Left colic flexure"],clinical:"Splenomegaly: haematological (lymphoma, leukaemia), infection (EBV, malaria), portal hypertension, storage diseases. Spontaneous rupture in EBV. Asplenic: encapsulated organisms risk (pneumococcus, H influenzae, meningococcus).",memo:"Asplenia vaccinations: Pneumococcal, Meningococcal, Hib + lifelong penicillin"},
  {id:"thymus",name:"Thymus",latin:"Thymus",sys:"lymphatic",region:"Thorax",type:"organ",desc:"Primary lymphoid organ, anterior mediastinum. Active in childhood, involutes with age. Cortex (T cell maturation) + medulla (Hassall's corpuscles).",fn:"T cell maturation and selection (positive/negative) — preventing autoimmunity",blood:"Internal thoracic artery branches",nerve:null,relations:["Trachea","Great vessels","Pericardium"],clinical:"Thymoma: anterior mediastinal mass. 30% associated with myasthenia gravis. DiGeorge syndrome: thymic aplasia → absent T cells, hypocalcaemia. 4T's of anterior mediastinum.",memo:"4T's anterior mediastinum: Thymoma, Teratoma, Thyroid, Terrible lymphoma (Hodgkin's)"},

  // SPECIAL SENSES
  {id:"eye",name:"Eye",latin:"Oculus",sys:"special_senses",region:"Head",type:"organ",desc:"Spherical, ~2.5cm. Layers: sclera → choroid → retina. Anterior: cornea, anterior chamber, iris, lens. Posterior: vitreous, retina (rods+cones), optic disc, macula.",fn:"Vision: light → photoreceptors → optic nerve → lateral geniculate → visual cortex",blood:"Ophthalmic artery (from ICA), central retinal artery",nerve:"CN II (optic), CN III/IV/VI (movement), CN V1 (sensation), CN VII (lacrimal)",relations:["Optic nerve","Orbit","Extraocular muscles","Lacrimal gland"],clinical:"Glaucoma: optic disc cupping from raised IOP. CRVO: blood and thunder fundus. Retinal detachment: curtain descending. Diabetic retinopathy: microaneurysms, neovascularisation. Papilloedema = raised ICP.",memo:"Argyll Robertson pupil (syphilis): 'Accommodates but doesn't react — like a prostitute'"},
  {id:"ear",name:"Ear",latin:"Auris",sys:"special_senses",region:"Head",type:"organ",desc:"Outer (pinna, canal, tympanic membrane). Middle (tympanic cavity, ossicles: malleus/incus/stapes, Eustachian tube). Inner (cochlea for hearing, semicircular canals + utricle + saccule for balance).",fn:"Hearing (mechanical → electrical via cochlea). Balance (semicircular canals: rotation; otoliths: linear acceleration).",blood:"Anterior tympanic, stylomastoid, deep auricular arteries",nerve:"CN VIII (vestibulocochlear), CN VII (stapedius, chorda tympani)",relations:["CN VII","Mastoid air cells","Temporomandibular joint"],clinical:"Conductive loss: Rinne negative (BC>AC), Weber to affected side. SNHL: Rinne positive, Weber to good ear. Acoustic neuroma: SNHL + tinnitus + vertigo. Cholesteatoma: foul discharge.",memo:"Weber to Worse = Conductive loss. Weber to Well = sensorineural (Weber to the better ear)"},
];

type AtlasEntry = (typeof DB)[number];
type SystemId = (typeof SYSTEMS)[number]["id"];

export default function AtlasPage() {
  const [search, setSearch] = useState("");
  const [system, setSystem] = useState<SystemId | null>(null);
  const [selected, setSelected] = useState<AtlasEntry | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DB.filter((s) => {
      const matchSys = !system || s.sys === system;
      const textFields = [s.name, s.latin, s.desc, s.region, s.type, s.clinical, s.memo, s.fn].filter(
        (f): f is string => typeof f === "string"
      );
      const matchQ = !q || textFields.some((f) => f.toLowerCase().includes(q));
      return matchSys && matchQ;
    });
  }, [search, system]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid hsl(var(--border))", padding: "14px 20px", background: "hsl(var(--card))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>🫀</span>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: 0 }}>Human Anatomy Atlas</h1>
            <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", margin: 0 }}>{DB.length} structures · 10 body systems · full clinical notes + mnemonics</p>
          </div>
        </div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "hsl(var(--muted-foreground))", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search: femur, vagus nerve, liver, rotator cuff, appendicitis..."
            style={{ width: "100%", paddingLeft: 40, paddingRight: search ? 36 : 12, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          {search && <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", padding: 4 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setSystem(null)}
            className={cn("btn px-3 py-1.5 text-xs font-medium rounded-lg", !system ? "btn-primary" : "btn-secondary")}>
            All ({DB.length})
          </button>
          {SYSTEMS.map(sys => {
            const cnt = DB.filter(s => s.sys === sys.id).length;
            return <button key={sys.id} onClick={() => setSystem(system === sys.id ? null : sys.id)}
              className={cn("btn px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1", system === sys.id ? "btn-primary" : "btn-secondary")}>
              <span style={{ fontSize: 12 }}>{sys.emoji}</span>
              <span className="hidden sm:inline">{sys.label}</span>
              <span style={{ fontSize: 10, opacity: .65 }}>({cnt})</span>
            </button>;
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* List */}
        <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid hsl(var(--border))", overflowY: "auto", display: mobileDetail ? "none" : "block" }}
          className="md:block">
          <div style={{ padding: "8px 16px", fontSize: 11, color: "hsl(var(--muted-foreground))", fontWeight: 500, borderBottom: "1px solid hsl(var(--border))", position: "sticky", top: 0, background: "hsl(var(--background))", zIndex: 5 }}>
            {filtered.length} structure{filtered.length !== 1 ? "s" : ""}
          </div>
          {filtered.map(s => {
            const sd = SYSTEMS.find((sy) => sy.id === s.sys);
            const tc = atlasTypeStyle(s.type);
            return (
              <button key={s.id} onClick={() => { setSelected(s); setMobileDetail(true); }}
                style={{ width: "100%", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid hsl(var(--border) / .4)", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10, background: selected?.id === s.id ? "hsl(var(--primary) / .06)" : "transparent", borderLeft: selected?.id === s.id ? "3px solid hsl(var(--primary))" : "3px solid transparent", transition: "background .1s" }}
                onMouseEnter={e => { if (selected?.id !== s.id) e.currentTarget.style.background = "hsl(var(--muted) / .5)"; }}
                onMouseLeave={e => { if (selected?.id !== s.id) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{sd?.emoji}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                  {s.latin && <p style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", margin: "1px 0", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.latin}</p>}
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize", tc.bg, tc.text)}>{s.type}</span>
                    <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>{s.region}</span>
                  </div>
                </div>
                <ChevronRight style={{ width: 14, height: 14, flexShrink: 0, marginTop: 4, color: "hsl(var(--muted-foreground) / .4)" }} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
              <Search style={{ width: 32, height: 32, opacity: .2, marginBottom: 12 }} />
              <p style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>Nothing found</p>
              <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", margin: "4px 0 0" }}>Try a different term</p>
            </div>
          )}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflowY: "auto", display: (!selected || (selected && !mobileDetail)) ? "flex" : "block" }}
          className={cn(!selected ? "items-center justify-center" : "")}>
          {selected ? (
            <div style={{ padding: "20px 24px", maxWidth: 720 }} className="animate-fade-in">
              <button onClick={() => setMobileDetail(false)} className="md:hidden"
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>
                ← Back
              </button>

              {/* Name + type */}
              <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid hsl(var(--border))" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-.02em" }}>{selected.name}</h2>
                    {selected.latin && <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", margin: "3px 0 0", fontStyle: "italic" }}>{selected.latin}</p>}
                  </div>
                  <span className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold capitalize flex-shrink-0 mt-1", atlasTypeStyle(selected.type).bg, atlasTypeStyle(selected.type).text)}>
                    {selected.type}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(() => { const sd = SYSTEMS.find(sy => sy.id === selected.sys); return sd ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, border: "1px solid hsl(var(--border))", padding: "4px 12px", fontSize: 12, fontWeight: 500 }}>
                      {sd.emoji} {sd.label}
                    </span>) : null; })()}
                  <span style={{ borderRadius: 20, border: "1px solid hsl(var(--border))", padding: "4px 12px", fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
                    📍 {selected.region}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{selected.desc}</p>

              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
                {selected.fn && (
                  <div style={{ borderRadius: 12, border: "1px solid hsl(var(--border))", padding: "14px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>⚙️ Function</p>
                    <p style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>{selected.fn}</p>
                  </div>
                )}
                {selected.blood && (
                  <div style={{ borderRadius: 12, border: "1px solid hsl(var(--border))", padding: "14px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>🩸 Blood Supply</p>
                    <p style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>{selected.blood}</p>
                  </div>
                )}
                {selected.nerve && (
                  <div style={{ borderRadius: 12, border: "1px solid hsl(var(--border))", padding: "14px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>⚡ Innervation</p>
                    <p style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>{selected.nerve}</p>
                  </div>
                )}
                {selected.relations && selected.relations.length > 0 && (
                  <div style={{ borderRadius: 12, border: "1px solid hsl(var(--border))", padding: "14px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>🔗 Relations</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selected.relations.map(r => (
                        <span key={r} style={{ borderRadius: 20, background: "hsl(var(--muted))", padding: "3px 10px", fontSize: 12 }}>{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Note */}
              {selected.clinical && (
                <div style={{ borderRadius: 12, border: "1px solid hsl(38 95% 54% / .3)", background: "hsl(38 95% 54% / .06)", padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Info style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: "hsl(38 75% 45%)" }} />
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "hsl(38 75% 45%)", marginBottom: 6 }}>Clinical Note</p>
                      <p style={{ fontSize: 13, lineHeight: 1.65, margin: 0 }}>{selected.clinical}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mnemonic */}
              {selected.memo && (
                <div style={{ borderRadius: 12, border: "1px solid hsl(260 80% 60% / .3)", background: "hsl(260 80% 60% / .06)", padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Zap style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: "hsl(260 80% 60%)" }} />
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "hsl(260 80% 60%)", marginBottom: 6 }}>Mnemonic</p>
                      <p style={{ fontSize: 13, lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>{selected.memo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* External links */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 16, borderTop: "1px solid hsl(var(--border))" }}>
                {[["Radiopaedia", `https://radiopaedia.org/search?q=${encodeURIComponent(selected.name)}`],
                  ["Kenhub", `https://www.kenhub.com/en/library/search?q=${encodeURIComponent(selected.name)}`],
                  ["Wikipedia", `https://en.wikipedia.org/wiki/${encodeURIComponent(selected.latin || selected.name)}`],
                  ["Geeky Medics", `https://geekymedics.com/?s=${encodeURIComponent(selected.name)}`]].map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10, border: "1px solid hsl(var(--border))", padding: "7px 14px", fontSize: 12, fontWeight: 500, textDecoration: "none", color: "inherit", transition: "background .12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "hsl(var(--muted))"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <ExternalLink style={{ width: 12, height: 12 }} /> {label}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🫀</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, margin: "0 0 6px" }}>Select a structure</p>
              <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", margin: 0, maxWidth: 280 }}>
                Search or browse {DB.length} anatomical structures with full clinical notes and mnemonics
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
