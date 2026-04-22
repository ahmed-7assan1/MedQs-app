const axios = require('axios');
require('dotenv').config();

const CONFIG = {
    SEMESTER_ID: '5f8dece2-6980-4a76-95ad-69d5850eb39b', // Sem 4
    SYNC_KEY: process.env.ADMIN_SYNC_KEY || "medqs_secret_sync_2026",
    API_URL: 'http://localhost:3000/api/v1/admin/sync/moodle' // Uses the same ingest API
};

const data = [
    {
        name: "Central Nervous and Special Senses Systems",
        subjects: [
            {
                name: "Anatomy",
                lectures: [
                    { title: "Development & Anatomy of the spinal cord" },
                    { title: "Development of CNS and External features of brain stem" },
                    { title: "Cerebellum and 4th ventricle" },
                    { title: "Diencephalon and 3rd ventricle Anatomy of the cerebral cortex lobes" },
                    { title: "Anatomy of the cortical areas and limbic system Limbic system and white matter" },
                    { title: "Internal features of the brain (Basal ganglia & internal capsule)" },
                    { title: "External features of the brain stem, Cerebellum & 4th ventricle" },
                    { title: "Lateral ventricle and CSF" },
                    { title: "Internal features of the brain stem (Medulla & pons)" },
                    { title: "Internal features of the brain stem (Midbrain) Diencephalon and 3rd ventricle" },
                    { title: "Ascending tracts and sensory system" },
                    { title: "Trigeminal system" },
                    { title: "Descending tracts and motor system" },
                    { title: "Ear 7th, 8th cranial nerves" },
                    { title: "Blood supply of the brain and spinal cord" },
                    { title: "Skull (Norma basalis and cranial nerves)" },
                    { title: "Orbit" },
                    { title: "Cranial nerves (1, 2, 3, 4, 6)" },
                    { title: "Cranial nerves (9, 10, 11, 12)" },
                    { title: "Anatomy & development of Pituitary gland" },
                    { title: "Anatomy & development of the Pancreas and adrenal gland" },
                    { title: "Anatomy & development of Thyroid and parathyroid glands" },
                    { title: "Gross anatomy of the female reproductive system" },
                    { title: "Bony pelvis & muscles" },
                    { title: "Gross anatomy of the male reproductive system" },
                    { title: "Development of male and female duct systems" },
                    { title: "Development and descend of gonads" },
                    { title: "Anatomy and development of the breast and axillary lymph nodes" },
                    { title: "Perineum" }
                ]
            },
            {
                name: "Physiology",
                lectures: [
                    { title: "Physiology of sensory receptors, sensory transduction" },
                    { title: "Physiology of coding of sensory information" },
                    { title: "Physiology of perception" },
                    { title: "Pain control system and sensory cortex" },
                    { title: "Neurophysiological principles of synaptic transmission" },
                    { title: "Physiology of spinal cord reflexes" },
                    { title: "Physiology of stretch reflex and inverse stretch reflex" },
                    { title: "Role of motor cortical areas and descending motor tracts" },
                    { title: "Characteristics of UNML and LMNL" },
                    { title: "Vestibular apparatus and its role in equilibrium" },
                    { title: "Physiology of basal ganglia" },
                    { title: "Role of the cerebellum in control of voluntary movements" },
                    { title: "Physiology of thalamus, reticular activating system (RAS)" },
                    { title: "Physiology of hypothalamus & limbic system" },
                    { title: "Physiology of sleep and memory" },
                    { title: "Physiology of higher functions of cortical association areas and speech" },
                    { title: "Physiology of the refractive apparatus of the eye" },
                    { title: "Physiology of phototransduction, retinal adaptation and binocular vision" },
                    { title: "Role of different parts of visual pathway in processing" },
                    { title: "Role of the external and middle ear in hearing" },
                    { title: "Role of the inner ear in hearing process and control of equilibrium" },
                    { title: "Physiology of taste and smell" },
                    { title: "Hypothalamus and posterior pituitary hormones" },
                    { title: "Anterior pituitary hormones 1" },
                    { title: "Anterior pituitary hormones 2" },
                    { title: "Physiology of thyroid hormones 1" },
                    { title: "Physiology of thyroid hormones 2" },
                    { title: "Physiology of pancreatic hormones" },
                    { title: "Physiology of adrenal cortex" },
                    { title: "Physiology of adrenal medulla" },
                    { title: "Hormonal Regulation of blood calcium" },
                    { title: "Spermatogenesis and male sex hormones 1" },
                    { title: "Spermatogenesis and male sex hormones 2" },
                    { title: "Physiology of female reproductive cycle 1" },
                    { title: "Physiology of female reproductive cycle 2" },
                    { title: "Physiology of pregnancy and function of placenta" },
                    { title: "Physiology of labor and lactation" }
                ]
            },
            {
                name: "Histology",
                lectures: [
                    { title: "Histology of the nervous system" },
                    { title: "Histology of spinal cord" },
                    { title: "Histology of the cerebral cortex and Cerebellar Cortex" },
                    { title: "Histological structure of the eye" },
                    { title: "Functional structure of the ear and receptors" },
                    { title: "Pituitary and pineal body" },
                    { title: "Adrenal gland, pancreatic islets and DNES" },
                    { title: "Thyroid and parathyroid gland" },
                    { title: "Testis and spermatogenesis" },
                    { title: "Male genital ducts and accessory male genital glands" },
                    { title: "Ovary and Oviduct" },
                    { title: "Uterus, Placenta and Mammary gland" }
                ]
            },
            {
                name: "Pharmacology",
                lectures: [
                    { title: "Sedative hypnotics" },
                    { title: "Antidepressant" },
                    { title: "Anti-psychotic" },
                    { title: "Opioid analgesics" },
                    { title: "Antiepileptic drugs I" },
                    { title: "Antiepileptic drugs II" },
                    { title: "Drug Therapy of Diabetes Mellitus Part I" },
                    { title: "Drug Therapy of Diabetes Mellitus Part II" },
                    { title: "Anti-Thyroid Drugs" },
                    { title: "Disorders of Bone metabolism" },
                    { title: "Contraception" },
                    { title: "Gonadal hormones agonist and antagonist 1" },
                    { title: "Gonadal hormones agonist and antagonist 2" },
                    { title: "Drugs and pregnancy" }
                ]
            },
            {
                name: "Pathology",
                lectures: [
                    { title: "Congenital anomalies and Hydrocephalus" },
                    { title: "CNS infections" },
                    { title: "Vascular CNS lesions" },
                    { title: "CNS neoplasias" },
                    { title: "Special sense organs diseases" },
                    { title: "Pathology of pituitary gland, pancreas & adrenal glands" },
                    { title: "Non-neoplastic diseases of the thyroid" },
                    { title: "Neoplastic diseases of the thyroid" },
                    { title: "Pathology of the testis, testicular adnexa and prostate" },
                    { title: "Pathology of ovary" },
                    { title: "Pathology Of the uterus and GTDs" },
                    { title: "Pathology Of vulva, vagina & cervix" },
                    { title: "Pathology of the Breast" }
                ]
            },
            {
                name: "Microbiology",
                lectures: [
                    { title: "Bacterial Infection of Nervous System" },
                    { title: "Viral meningitis" },
                    { title: "Viral encephalitis" },
                    { title: "Fungal encephalitis" },
                    { title: "Bacterial genital system infections" },
                    { title: "Viral genital system infections" },
                    { title: "Infections in pregnancy, congenital and neonatal infections" }
                ]
            },
            {
                name: "Parasitology",
                lectures: [
                    { title: "Parasitic Infections Affecting the CNS 1" },
                    { title: "Parasites affecting the reproductive system (Toxoplasmosis)" },
                    { title: "Sexually transmitted parasites (Trichomoniasis)" }
                ]
            },
            {
                name: "Biochemistry",
                lectures: [
                    { title: "Mechanism of hormonal Action" },
                    { title: "Diagnosis of diabetes" },
                    { title: "Biochemistry of sex hormones" },
                    { title: "Pregnancy Test" }
                ]
            },
            {
                name: "Psychology",
                lectures: [
                    { title: "Memory" },
                    { title: "Intelligence" },
                    { title: "Perception" }
                ]
            }
        ]
    },
    {
        name: "Research and Biostatistics",
        subjects: [
            {
                name: "Research & Biostatistics",
                lectures: [
                    { title: "Introduction to research methodology" },
                    { title: "Analytic studies I (case control study)" },
                    { title: "Analytic studies II (Cohort study)" },
                    { title: "Analytic studies" },
                    { title: "Experimental study" },
                    { title: "Medical statistics I" },
                    { title: "Medical statistics II" },
                    { title: "Role of screening tests in diagnosis" },
                    { title: "Measurement of mortality" }
                ]
            }
        ]
    },
    {
        name: "Early Clinical Experience 3",
        subjects: [
            {
                name: "ECE 3",
                lectures: [
                    { title: "Cardiac examination" },
                    { title: "Neurological examination" }
                ]
            }
        ]
    }
];

async function run() {
    console.log("--- Importing MedQs Structure from Student Guide ---");
    try {
        const response = await axios.post(CONFIG.API_URL, {
            semesterId: CONFIG.SEMESTER_ID,
            modules: data
        }, {
            headers: { 'x-admin-sync-key': CONFIG.SYNC_KEY }
        });

        if (response.data.ok) {
            console.log("SUCCESS! Your structure is now live based on the guide.");
            console.log("Stats:", response.data.stats);
        } else {
            console.log("Error:", response.data.error);
        }
    } catch (e) {
        console.error("Failed to sync:", e.message);
    }
}

run();
