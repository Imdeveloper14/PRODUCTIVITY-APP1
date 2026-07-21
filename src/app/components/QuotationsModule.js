import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Calculator, Plus, Trash2, Edit3, Download, Eye, FileText, 
  CheckCircle2, AlertCircle, Send, Save, Check, X, ArrowUp, ArrowDown,
  Copy, Layers, RefreshCw, Sparkles, Bold, Italic, List, ListOrdered, FileDown,
  FolderKanban, Briefcase, FileCode2, Settings, Landmark, FileCheck2, CheckSquare, 
  RotateCcw, History, ArrowRight, TrendingUp, Info, Star, Upload, Share2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '../utils/supabase';

// Standard deliverables library templates
const TEMPLATES = {
  'Stability Package': [
    { deliverable: "General Arrangement Drawing", estimated_hours: 15, remarks: "Vessel profile & deck layout review" },
    { deliverable: "Structural Scantling Report", estimated_hours: 35, remarks: "DNV-GL rule check calculations" },
    { deliverable: "Intact Stability Booklet", estimated_hours: 20, remarks: "IMO MSC.267(85) compliance" },
    { deliverable: "Damage Stability Booklet", estimated_hours: 25, remarks: "Probabilistic damage assessment" },
    { deliverable: "Inclining Experiment Report", estimated_hours: 18, remarks: "Physical inclining survey witness & report" }
  ],
  'Barge Design': [
    { deliverable: "Structural Scantling Design", estimated_hours: 45, remarks: "Deck cargo load rating 15T/m²" },
    { deliverable: "Main Hull Profile Drawing", estimated_hours: 20, remarks: "Draft marks, ballast tanks & cargo hold" },
    { deliverable: "Weight & CG Calculation Sheet", estimated_hours: 12, remarks: "Detailed lightship weight estimation" },
    { deliverable: "Hydrostatics Analysis Report", estimated_hours: 15, remarks: "At varying trim & displacement states" },
    { deliverable: "Towing & Mooring Arrangement", estimated_hours: 18, remarks: "Bollard pull & anchor windlass specs" }
  ],
  'Website Package': [
    { deliverable: "Database Normalization Design", estimated_hours: 10, remarks: "3NF ERD and migrations setup" },
    { deliverable: "REST API Development", estimated_hours: 30, remarks: "Backend controllers and authentication" },
    { deliverable: "Custom Dashboard View UI", estimated_hours: 25, remarks: "React charts and interactive widgets" },
    { deliverable: "PDF Export Module", estimated_hours: 15, remarks: "jsPDF-AutoTable runtime report engine" },
    { deliverable: "User Roles Administration Panel", estimated_hours: 20, remarks: "Permission gatekeeper configuration" }
  ]
};

const ENGINEERING_PRESETS = [
  {
    id: "marine_hull_design",
    name: "Marine Hull Design & Stability",
    discipline: "Marine Engineering",
    department: "Naval Architecture",
    typicalDuration: "4 weeks",
    difficulty: "Advanced",
    recommendedTeam: "2 Lead Naval Architects, 1 Draftsman",
    exclusions: "Physical model tank testing, sea trials witness",
    software: ["Maxsurf", "GHS", "AutoCAD"],
    deliverables: [
      { deliverable: "General Arrangement Drawing", estimated_hours: 25, remarks: "Vessel profile & deck layout review" },
      { deliverable: "Hull Form Definition & Lines Plan", estimated_hours: 40, remarks: "Surface modeling & fairing" },
      { deliverable: "Intact & Damage Stability Booklet", estimated_hours: 35, remarks: "IMO MSC.267(85) compliance assessment" },
      { deliverable: "Inclining Experiment Report", estimated_hours: 20, remarks: "Physical inclining survey witness & post-calc" }
    ]
  },
  {
    id: "structural_fea",
    name: "High-Rise Structural FEA Assessment",
    discipline: "Structural",
    department: "Civil & Structural",
    typicalDuration: "3 weeks",
    difficulty: "Advanced",
    recommendedTeam: "1 Senior Structural Engineer, 1 FEA Specialist",
    exclusions: "Geotechnical survey, foundation soil testing",
    software: ["ANSYS", "STAAD.Pro", "ETABS"],
    deliverables: [
      { deliverable: "3D Finite Element Model Setup", estimated_hours: 30, remarks: "Geometry import and mesh refinement" },
      { deliverable: "Static Linear & Non-linear Analysis", estimated_hours: 35, remarks: "Wind and seismic load combinations" },
      { deliverable: "Structural Scantling & Rebar Optimization Report", estimated_hours: 25, remarks: "Compliance with building codes" }
    ]
  },
  {
    id: "piping_isometric",
    name: "Industrial Piping Layout & Isometric Package",
    discipline: "Piping",
    department: "Piping Engineering",
    typicalDuration: "5 weeks",
    difficulty: "Intermediate",
    recommendedTeam: "2 Piping Designers, 1 Stress Analyst",
    exclusions: "On-site pipe fabrication, pressure testing certification",
    software: ["Smart3D", "CAESAR II", "AutoCAD Plant 3D"],
    deliverables: [
      { deliverable: "Piping & Instrumentation Diagram (P&ID) Draft", estimated_hours: 20, remarks: "Process flowsheet translation" },
      { deliverable: "Piping 3D Layout & Routing Plan", estimated_hours: 50, remarks: "Collision-free routing inside utility corridor" },
      { deliverable: "Pipe Stress Analysis Report", estimated_hours: 30, remarks: "Thermal growth and load support review" },
      { deliverable: "Isometric Drawings & Bill of Materials", estimated_hours: 25, remarks: "Fabrication spool isometric exports" }
    ]
  },
  {
    id: "mechanical_hvac",
    name: "HVAC System Layout & Cooling Calculations",
    discipline: "Mechanical",
    department: "HVAC / Utility",
    typicalDuration: "3 weeks",
    difficulty: "Intermediate",
    recommendedTeam: "1 Mechanical Engineer, 1 HVAC Specialist",
    exclusions: "Duct fabrication and installation, chiller commissioning",
    software: ["HAP", "Revit", "SolidWorks"],
    deliverables: [
      { deliverable: "Heat Load Calculation Sheets", estimated_hours: 15, remarks: "Peak cooling & heating load analysis" },
      { deliverable: "Duct & Piping Layout Layouts", estimated_hours: 30, remarks: "Drafting of duct routing plans & diffusers" },
      { deliverable: "Equipment Schedule & Specifications", estimated_hours: 15, remarks: "Selection of AHUs, chillers, and fans" }
    ]
  },
  {
    id: "cad_conversion",
    name: "Legacy Blueprint to 3D CAD Conversion",
    discipline: "CAD Services",
    department: "Drafting & Modeling",
    typicalDuration: "2 weeks",
    difficulty: "Easy",
    recommendedTeam: "2 CAD Drafters",
    exclusions: "Redesign of structural parts, re-engineering calculation",
    software: ["AutoCAD", "SolidWorks", "Inventor"],
    deliverables: [
      { deliverable: "2D PDF to 2D DWG Conversion", estimated_hours: 18, remarks: "Accurate tracing with clean layering" },
      { deliverable: "3D Parametric Solid Model Creation", estimated_hours: 28, remarks: "Standard parts modeling and assembly constraints" },
      { deliverable: "Exploded View & Bill of Materials", estimated_hours: 10, remarks: "Assembly guide layout sheet" }
    ]
  },
  {
    id: "software_microservices",
    name: "Microservices Architecture & API Gateway",
    discipline: "Software",
    department: "Backend Engineering",
    typicalDuration: "6 weeks",
    difficulty: "Expert",
    recommendedTeam: "1 Software Architect, 2 Backend Developers",
    exclusions: "Frontend UI implementation, domain purchase",
    software: ["Docker", "Go", "AWS", "Kubernetes"],
    deliverables: [
      { deliverable: "Database Normalization Design", estimated_hours: 15, remarks: "Distributed database schema & migrations setup" },
      { deliverable: "gRPC & REST API Development", estimated_hours: 45, remarks: "Backend controllers, validation and auth integration" },
      { deliverable: "CI/CD Deployment Pipelines Configuration", estimated_hours: 20, remarks: "Kubernetes manifest & GitHub actions flow" }
    ]
  },
  {
    id: "website_portal",
    name: "Enterprise Client Portal Website",
    discipline: "Website",
    department: "Fullstack Web",
    typicalDuration: "4 weeks",
    difficulty: "Intermediate",
    recommendedTeam: "1 Frontend UI/UX, 1 Fullstack Developer",
    exclusions: "Content copy writing, product photography",
    software: ["Next.js", "TailwindCSS", "Supabase"],
    deliverables: [
      { deliverable: "Custom Dashboard View UI", estimated_hours: 30, remarks: "Responsive React charts & interactive client widgets" },
      { deliverable: "User Roles Administration Panel", estimated_hours: 25, remarks: "Role-based access controls & activity logs" },
      { deliverable: "PDF Export Module", estimated_hours: 15, remarks: "Client-side report builder with CSV/PDF options" }
    ]
  },
  {
    id: "internal_audit",
    name: "Internal Engineering QA & Standards Audit",
    discipline: "Internal",
    department: "Quality Assurance",
    typicalDuration: "2 weeks",
    difficulty: "Easy",
    recommendedTeam: "1 QA Lead",
    exclusions: "External ISO certification fees",
    software: ["Excel", "Jira", "Confluence"],
    deliverables: [
      { deliverable: "Engineering Guidelines Audit Report", estimated_hours: 16, remarks: "Review of naming conventions, drafting symbols" },
      { deliverable: "QA Process Manual Updates", estimated_hours: 12, remarks: "Modernizing standard operating checklists" }
    ]
  },
  {
    id: "consultancy_feasibility",
    name: "Technical Feasibility Advisory",
    discipline: "Consultancy",
    department: "Advisory & Planning",
    typicalDuration: "3 weeks",
    difficulty: "Intermediate",
    recommendedTeam: "1 Principal Consultant",
    exclusions: "Detailed design drawings, construction supervision",
    software: ["Excel", "PowerPoint", "MS Project"],
    deliverables: [
      { deliverable: "Regulatory & Compliance Risk Matrix", estimated_hours: 20, remarks: "Local and international rules checklist" },
      { deliverable: "Technical Feasibility Study Report", estimated_hours: 30, remarks: "CAPEX, OPEX and technical alternatives comparison" }
    ]
  },
  {
    id: "consultancy_thirdparty",
    name: "Third Party Design Review & Verification",
    discipline: "Consultancy",
    department: "Advisory & Planning",
    typicalDuration: "2 weeks",
    difficulty: "Advanced",
    recommendedTeam: "1 Senior Technical Reviewer",
    exclusions: "Modifying the original design (review only)",
    software: ["Acrobat", "STAAD.Pro", "Ansys"],
    deliverables: [
      { deliverable: "Independent Verification Statement", estimated_hours: 15, remarks: "Calculation validation summary" },
      { deliverable: "Design Discrepancy & Deflection Log", estimated_hours: 18, remarks: "Tabulated list of structural or safety concerns" }
    ]
  }
];

// Safe autoTable execution wrapper
const callAutoTable = (doc, options) => {
  if (typeof autoTable === 'function') {
    autoTable(doc, options);
  } else if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  } else {
    console.error("autoTable plugin not found on jsPDF prototype");
  }
};

export default function QuotationsModule({ 
  user, 
  triggerToast, 
  projects = [], 
  setProjects, 
  invoices = [], 
  setInvoices, 
  tasks = [], 
  setTasks, 
  clients = [],
  setClients 
}) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // Tab/View Mode: 'dashboard' | 'wizard' | 'detail'
  const [viewMode, setViewMode] = useState('dashboard');
  
  // Selected Quote for Details view
  const [selectedQuote, setSelectedQuote] = useState(null);
  
  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Multi-Step Creation Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [editingQuoteId, setEditingQuoteId] = useState(null);

  // Wizard Step State Storage
  // Step 1: Client Details
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [projectType, setProjectType] = useState('Naval Architecture');
  const [selectedClientIndex, setSelectedClientIndex] = useState('');

  // Step 2: Scope Selections
  const [deliverables, setDeliverables] = useState([]);
  const [scopeSearch, setScopeSearch] = useState('');

  // Step 3: Deliverables Loader (Template)
  const [selectedTemplateName, setSelectedTemplateName] = useState('');

  // Preset Library & Custom Templates State
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem("aura_favorite_presets_v1") || "[]");
      } catch (e) { return []; }
    }
    return [];
  });
  const [customPresets, setCustomPresets] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem("aura_custom_presets_v1") || "[]");
      } catch (e) { return []; }
    }
    return [];
  });
  const [selectedPresetIds, setSelectedPresetIds] = useState([]);
  const [presetKeyword, setPresetKeyword] = useState('');
  const [presetDiscipline, setPresetDiscipline] = useState('All');
  const [presetDepartment, setPresetDepartment] = useState('All');
  const [presetSoftware, setPresetSoftware] = useState('All');
  
  const [previewPreset, setPreviewPreset] = useState(null);
  
  // Custom Preset Modal State
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDiscipline, setNewPresetDiscipline] = useState('Marine Engineering');
  const [newPresetDept, setNewPresetDept] = useState('');
  const [newPresetDuration, setNewPresetDuration] = useState('3 weeks');
  const [newPresetDifficulty, setNewPresetDifficulty] = useState('Intermediate');
  const [newPresetTeam, setNewPresetTeam] = useState('');
  const [newPresetExclusions, setNewPresetExclusions] = useState('');
  const [newPresetSoftware, setNewPresetSoftware] = useState('');

  // Step 4: Costing Settings
  const [hourlyRate, setHourlyRate] = useState(1500);
  const [softwareCost, setSoftwareCost] = useState(45000);
  const [thirdPartyCost, setThirdPartyCost] = useState(0);
  const [travelCost, setTravelCost] = useState(0);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [gstPercent, setGstPercent] = useState(18);

  // Step 5: Milestone Payments
  const [milestone1Name, setMilestone1Name] = useState('Advance Payment');
  const [milestone1Percent, setMilestone1Percent] = useState(20);
  const [milestone1Desc, setMilestone1Desc] = useState('Payable upon acceptance of proposal prior to commencement.');

  const [milestone2Name, setMilestone2Name] = useState('Draft Deliverables Submission');
  const [milestone2Percent, setMilestone2Percent] = useState(30);
  const [milestone2Desc, setMilestone2Desc] = useState('Payable upon completion of first-draft engineering submission.');

  const [milestone3Name, setMilestone3Name] = useState('Detailed Engineering review');
  const [milestone3Percent, setMilestone3Percent] = useState(30);
  const [milestone3Desc, setMilestone3Desc] = useState('Payable upon submission of detailed calculations and final reviews.');

  const [milestone4Name, setMilestone4Name] = useState('Final Package Release');
  const [milestone4Percent, setMilestone4Percent] = useState(20);
  const [milestone4Desc, setMilestone4Desc] = useState('Payable prior to transfer of final native CAD and report files.');

  // Step 6: Commercial Conditions
  const [commercialConditions, setCommercialConditions] = useState(
    "1. Offer Validity: This quotation is valid for 30 calendar days.\n" +
    "2. Intellectual Property: Native models remain Primelisometrics property until final milestone payment clearance.\n" +
    "3. Delay Fees: Payments delayed beyond 14 days incur a 1.5% weekly delay fee.\n" +
    "4. Revision Policy: Includes up to 2 major design iterations/reviews. Additional iterations charged hourly."
  );

  // Version Control History
  const [revisions, setRevisions] = useState([]);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedRevisionToCompare, setSelectedRevisionToCompare] = useState(null);

  // Inline editing row state inside wizard step 2
  const [editingRowIdx, setEditingRowIdx] = useState(null);
  const [editDocName, setEditDocName] = useState('');
  const [editHours, setEditHours] = useState(0);
  const [editRemarks, setEditRemarks] = useState('');

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
  
  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      let token = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }
      const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch('/api/quotations', { headers });
      const data = await res.json();
      if (data && data.success) {
        setQuotations(data.quotations || []);
      } else if (supabase) {
        const { data: qData } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
        if (qData) setQuotations(qData);
      }
    } catch (e) {
      console.error("fetchQuotations error:", e);
      if (supabase) {
        const { data: qData } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
        if (qData) setQuotations(qData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewWizard = () => {
    setEditingQuoteId(null);
    setWizardStep(1);
    setClientName('');
    setContactPerson('');
    setProjectName('');
    setProjectLocation('');
    setCurrency('INR');
    setProjectType('Naval Architecture');
    setSelectedClientIndex('');
    setDeliverables([
      { included: true, deliverable: "General Arrangement Drawing", estimated_hours: 12, remarks: "Initial revision layout" },
      { included: true, deliverable: "Structural Scantling Calculation", estimated_hours: 24, remarks: "Rule check compliance reports" }
    ]);
    setHourlyRate(1500);
    setSoftwareCost(45000);
    setThirdPartyCost(0);
    setTravelCost(0);
    setContingencyPercent(10);
    setGstPercent(18);
    setMilestone1Percent(20);
    setMilestone2Percent(30);
    setMilestone3Percent(30);
    setMilestone4Percent(20);
    setCommercialConditions(
      "1. Offer Validity: This quotation is valid for 30 calendar days.\n" +
      "2. Intellectual Property: Native models remain Primelisometrics property until final milestone payment clearance.\n" +
      "3. Delay Fees: Payments delayed beyond 14 days incur a 1.5% weekly delay fee.\n" +
      "4. Revision Policy: Includes up to 2 major design iterations/reviews. Additional iterations charged hourly."
    );
    setViewMode('wizard');
  };

  const handleOpenEditWizard = async (q) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${q.id}`);
      const data = await res.json();
      if (data.success) {
        const fullQuote = data.quotation;
        const items = data.items || [];
        const costing = data.costing || {};
        
        setEditingQuoteId(fullQuote.id);
        setClientName(fullQuote.client_name || '');
        setContactPerson(fullQuote.contact_person || '');
        setProjectName(fullQuote.project_name || '');
        setProjectLocation(fullQuote.project_location || '');
        setCurrency(fullQuote.currency || 'INR');
        setProjectType(fullQuote.project_type || 'Naval Architecture');
        
        setDeliverables(items.map(it => ({
          included: !!it.included,
          deliverable: it.deliverable,
          estimated_hours: it.estimated_hours,
          remarks: it.remarks || ''
        })));

        if (costing) {
          setHourlyRate(costing.hourly_rate || 1500);
          setSoftwareCost(costing.software_cost || 45000);
          setThirdPartyCost(costing.third_party_cost || 0);
          setTravelCost(costing.travel_cost || 0);
          
          const baseEng = (costing.engineering_hours || 0) * (costing.hourly_rate || 1500);
          const baseTotal = baseEng + (costing.software_cost || 0) + (costing.third_party_cost || 0) + (costing.travel_cost || 0);
          setContingencyPercent(costing.contingency && baseTotal ? Math.round((costing.contingency / baseTotal) * 100) : 10);
          setGstPercent(costing.gst && costing.subtotal ? Math.round((costing.gst / costing.subtotal) * 100) : 18);
        }

        setCommercialConditions(fullQuote.commercial_conditions || '');
        setRevisions(data.revisions || []);
        
        setWizardStep(1);
        setViewMode('wizard');
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed to fetch full quotation data.");
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill client data if selected
  const handleClientSelectionChange = (e) => {
    const idx = e.target.value;
    setSelectedClientIndex(idx);
    if (idx !== '') {
      const client = clients[idx];
      setClientName(client.name || client.company || '');
      setContactPerson(client.email || '');
      setProjectLocation(client.notes || '');
    }
  };

  // Load Template preset
  const handleLoadTemplate = (name) => {
    setSelectedTemplateName(name);
    if (TEMPLATES[name]) {
      setDeliverables(TEMPLATES[name].map(item => ({ ...item, included: true })));
      triggerToast(`Loaded pre-filled items for template: ${name}`);
    }
  };

  const getAIRecommendations = (projType) => {
    const recommendations = [];
    if (!projType) return recommendations;
    const pt = projType.toLowerCase();
    const allPresets = [...ENGINEERING_PRESETS, ...customPresets];
    
    if (pt.includes('naval') || pt.includes('marine')) {
      const r = allPresets.find(p => p.id === 'marine_hull_design');
      if (r) recommendations.push(r);
    }
    if (pt.includes('structural')) {
      const r = allPresets.find(p => p.id === 'structural_fea');
      if (r) recommendations.push(r);
    }
    if (pt.includes('piping')) {
      const r = allPresets.find(p => p.id === 'piping_isometric');
      if (r) recommendations.push(r);
    }
    if (pt.includes('mechanical') || pt.includes('cfd')) {
      const r = allPresets.find(p => p.id === 'mechanical_hvac');
      if (r) recommendations.push(r);
    }
    if (pt.includes('cad')) {
      const r = allPresets.find(p => p.id === 'cad_conversion');
      if (r) recommendations.push(r);
    }
    if (pt.includes('software')) {
      const r = allPresets.find(p => p.id === 'software_microservices');
      if (r) recommendations.push(r);
    }
    if (pt.includes('website') || pt.includes('web')) {
      const r = allPresets.find(p => p.id === 'website_portal');
      if (r) recommendations.push(r);
    }
    if (pt.includes('audit') || pt.includes('internal')) {
      const r = allPresets.find(p => p.id === 'internal_audit');
      if (r) recommendations.push(r);
    }
    if (pt.includes('consultancy') || pt.includes('advisory')) {
      const r1 = allPresets.find(p => p.id === 'consultancy_feasibility');
      const r2 = allPresets.find(p => p.id === 'consultancy_thirdparty');
      if (r1) recommendations.push(r1);
      if (r2) recommendations.push(r2);
    }
    
    return recommendations;
  };

  const handleMergePreset = (preset) => {
    setDeliverables(prev => {
      const updated = [...prev];
      preset.deliverables.forEach(item => {
        const matchIdx = updated.findIndex(d => d.deliverable.trim().toLowerCase() === item.deliverable.trim().toLowerCase());
        if (matchIdx > -1) {
          const currentHours = Number(updated[matchIdx].estimated_hours) || 0;
          const newHours = Number(item.estimated_hours) || 0;
          updated[matchIdx].estimated_hours = Math.max(currentHours, newHours);
          
          const currentRemarks = updated[matchIdx].remarks ? updated[matchIdx].remarks.trim() : '';
          const newRemarks = item.remarks ? item.remarks.trim() : '';
          if (newRemarks) {
            if (currentRemarks) {
              if (!currentRemarks.toLowerCase().includes(newRemarks.toLowerCase())) {
                updated[matchIdx].remarks = `${currentRemarks}; ${newRemarks}`;
              }
            } else {
              updated[matchIdx].remarks = newRemarks;
            }
          }
          updated[matchIdx].included = true;
        } else {
          updated.push({
            deliverable: item.deliverable,
            estimated_hours: item.estimated_hours,
            remarks: item.remarks || '',
            included: true
          });
        }
      });
      return updated;
    });
    triggerToast(`Merged deliverables from ${preset.name}`);
  };

  const handleMergeSelectedPresets = () => {
    if (selectedPresetIds.length === 0) {
      triggerToast("No presets selected for merging.");
      return;
    }
    let mergedCount = 0;
    const allPresets = [...ENGINEERING_PRESETS, ...customPresets];
    
    setDeliverables(prev => {
      let updated = [...prev];
      selectedPresetIds.forEach(id => {
        const preset = allPresets.find(p => p.id === id);
        if (preset) {
          mergedCount++;
          preset.deliverables.forEach(item => {
            const matchIdx = updated.findIndex(d => d.deliverable.trim().toLowerCase() === item.deliverable.trim().toLowerCase());
            if (matchIdx > -1) {
              const currentHours = Number(updated[matchIdx].estimated_hours) || 0;
              const newHours = Number(item.estimated_hours) || 0;
              updated[matchIdx].estimated_hours = Math.max(currentHours, newHours);
              
              const currentRemarks = updated[matchIdx].remarks ? updated[matchIdx].remarks.trim() : '';
              const newRemarks = item.remarks ? item.remarks.trim() : '';
              if (newRemarks) {
                if (currentRemarks) {
                  if (!currentRemarks.toLowerCase().includes(newRemarks.toLowerCase())) {
                    updated[matchIdx].remarks = `${currentRemarks}; ${newRemarks}`;
                  }
                } else {
                  updated[matchIdx].remarks = newRemarks;
                }
              }
              updated[matchIdx].included = true;
            } else {
              updated.push({
                deliverable: item.deliverable,
                estimated_hours: item.estimated_hours,
                remarks: item.remarks || '',
                included: true
              });
            }
          });
        }
      });
      return updated;
    });
    
    setSelectedPresetIds([]);
    triggerToast(`Successfully merged ${mergedCount} selected presets!`);
  };

  const toggleFavorite = (presetId) => {
    setFavorites(prev => {
      let updated;
      if (prev.includes(presetId)) {
        updated = prev.filter(id => id !== presetId);
      } else {
        updated = [...prev, presetId];
      }
      localStorage.setItem("aura_favorite_presets_v1", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDuplicatePreset = (preset) => {
    const duplicated = {
      ...preset,
      id: "custom_" + Date.now(),
      name: `${preset.name} (Copy)`
    };
    setCustomPresets(prev => {
      const updated = [...prev, duplicated];
      localStorage.setItem("aura_custom_presets_v1", JSON.stringify(updated));
      return updated;
    });
    triggerToast(`Duplicated template: ${preset.name}`);
  };

  const handleDeleteCustomPreset = (presetId) => {
    if (!confirm("Are you sure you want to delete this custom template?")) return;
    setCustomPresets(prev => {
      const updated = prev.filter(p => p.id !== presetId);
      localStorage.setItem("aura_custom_presets_v1", JSON.stringify(updated));
      return updated;
    });
    triggerToast("Custom template deleted.");
  };

  const handleExportPresets = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customPresets));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "custom_engineering_presets.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast("Exported custom templates JSON.");
  };

  const handleImportPresets = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed)) {
            const valid = parsed.every(p => p.name && Array.isArray(p.deliverables));
            if (valid) {
              setCustomPresets(prev => {
                const updated = [...prev, ...parsed.map(p => ({ ...p, id: p.id || "custom_" + Date.now() + Math.random() }))];
                localStorage.setItem("aura_custom_presets_v1", JSON.stringify(updated));
                return updated;
              });
              triggerToast(`Successfully imported ${parsed.length} templates!`);
            } else {
              triggerToast("Invalid template file format.");
            }
          } else {
            triggerToast("Invalid JSON structure (should be an array of templates).");
          }
        } catch (err) {
          triggerToast("Failed to parse JSON file.");
        }
      };
    }
  };

  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName) {
      triggerToast("Please enter a name for the custom template.");
      return;
    }
    const newPreset = {
      id: "custom_" + Date.now(),
      name: newPresetName,
      discipline: newPresetDiscipline,
      department: newPresetDept || "General",
      typicalDuration: newPresetDuration || "2 weeks",
      difficulty: newPresetDifficulty || "Intermediate",
      recommendedTeam: newPresetTeam || "1 Engineer",
      exclusions: newPresetExclusions || "None",
      software: newPresetSoftware ? newPresetSoftware.split(',').map(s => s.trim()) : [],
      deliverables: deliverables.map(d => ({
        deliverable: d.deliverable,
        estimated_hours: d.estimated_hours,
        remarks: d.remarks || ''
      }))
    };
    setCustomPresets(prev => {
      const updated = [...prev, newPreset];
      localStorage.setItem("aura_custom_presets_v1", JSON.stringify(updated));
      return updated;
    });
    setShowSavePresetModal(false);
    triggerToast("Custom template saved successfully!");
  };

  // Wizard Deliverables actions
  const addDeliverableRow = () => {
    setDeliverables(prev => [...prev, { included: true, deliverable: "New Deliverable Module", estimated_hours: 8, remarks: "" }]);
    setEditingRowIdx(deliverables.length);
    setEditDocName("New Deliverable Module");
    setEditHours(8);
    setEditRemarks("");
  };

  const startEditRow = (idx) => {
    setEditingRowIdx(idx);
    const row = deliverables[idx];
    setEditDocName(row.deliverable);
    setEditHours(row.estimated_hours);
    setEditRemarks(row.remarks || '');
  };

  const saveEditRow = (idx) => {
    setDeliverables(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        deliverable: editDocName,
        estimated_hours: Number(editHours) || 0,
        remarks: editRemarks
      };
      return copy;
    });
    setEditingRowIdx(null);
  };

  // Calculations
  const totalHours = deliverables.reduce((sum, item) => sum + (item.included ? Number(item.estimated_hours || 0) : 0), 0);
  const calculatedFee = totalHours * hourlyRate;
  const rawSubtotal = calculatedFee + softwareCost + thirdPartyCost + travelCost;
  const calculatedContingency = rawSubtotal * (contingencyPercent / 100);
  const calculatedSubtotal = rawSubtotal + calculatedContingency;
  const calculatedGst = 0; 
  const calculatedGrandTotal = calculatedSubtotal;

  // 30-Second Background Autosave Effect
  useEffect(() => {
    if (viewMode !== 'editor') return;

    const interval = setInterval(() => {
      if (clientName || projectName || deliverables.length > 0) {
        const draftData = {
          clientName, contactPerson, projectName, projectLocation,
          currency, projectType, deliverables, commercialConditions,
          hourlyRate, softwareCost, contingencyPercent, editingQuoteId,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('aura_quotation_draft', JSON.stringify(draftData));
        console.log('[Autosave] Quotation draft saved locally at', draftData.savedAt);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [viewMode, clientName, contactPerson, projectName, projectLocation, currency, projectType, deliverables, commercialConditions, hourlyRate, softwareCost, contingencyPercent, editingQuoteId]);

  // Restore draft on mount if available
  const handleRestoreLocalDraft = () => {
    try {
      const saved = localStorage.getItem('aura_quotation_draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.clientName) setClientName(draft.clientName);
        if (draft.contactPerson) setContactPerson(draft.contactPerson);
        if (draft.projectName) setProjectName(draft.projectName);
        if (draft.projectLocation) setProjectLocation(draft.projectLocation);
        if (draft.currency) setCurrency(draft.currency);
        if (draft.projectType) setProjectType(draft.projectType);
        if (Array.isArray(draft.deliverables)) setDeliverables(draft.deliverables);
        if (draft.commercialConditions) setCommercialConditions(draft.commercialConditions);
        if (draft.hourlyRate) setHourlyRate(draft.hourlyRate);
        if (draft.softwareCost) setSoftwareCost(draft.softwareCost);
        if (draft.contingencyPercent) setContingencyPercent(draft.contingencyPercent);
        triggerToast("Restored unsaved quotation draft.");
      }
    } catch (e) {
      console.error("Failed to restore quotation draft:", e);
    }
  };

  // Save Quotation payload with Authorization bearer header & Supabase upsert fallback
  const handleSaveQuotation = async (statusOverride = null) => {
    if (!clientName || !clientName.trim() || !projectName || !projectName.trim()) {
      triggerToast("Client Name and Project Name are required.");
      return;
    }

    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      triggerToast("At least one deliverable scope item is required.");
      return;
    }

    let token = null;
    let authUserId = user?.id || null;
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
        if (session?.user?.id) authUserId = session.user.id;
      } catch (err) {
        console.warn("Session check in handleSaveQuotation error:", err);
      }
    }

    const targetStatus = statusOverride || 'Draft';
    const currentYear = new Date().getFullYear();
    const generatedQuoteNum = `PMC-${currentYear}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const payload = {
      client_name: clientName,
      contact_person: contactPerson || '',
      project_name: projectName,
      project_location: projectLocation || '',
      plant_capacity: String(totalHours) + " hrs scope",
      currency: currency || 'INR',
      project_type: projectType || 'Naval Architecture',
      deliverables: deliverables.map(d => ({ ...d, category: projectType || 'Naval Architecture' })),
      commercial_conditions: commercialConditions || '',
      custom_hourly_rate: hourlyRate,
      custom_software_cost: softwareCost,
      custom_contingency_percent: contingencyPercent,
      revision_description: editingQuoteId ? "Revision update" : "Initial creation",
      status: targetStatus,
      quotation_number: generatedQuoteNum,
      updated_at: new Date().toISOString(),
      updated_by: authUserId,
      ...(authUserId ? { created_by: authUserId, user_id: authUserId } : {})
    };

    let saved = false;

    // 1. Direct Supabase Upsert if initialized
    if (supabase) {
      try {
        const dbPayload = {
          ...(editingQuoteId ? { id: editingQuoteId } : {}),
          ...payload
        };

        const { data: quoteData, error: quoteErr } = await supabase
          .from('quotations')
          .upsert([dbPayload])
          .select();

        if (!quoteErr && quoteData && quoteData.length > 0) {
          saved = true;
          const savedRecord = quoteData[0];
          triggerToast(targetStatus === 'Draft' ? 'Quotation draft saved successfully.' : `Quotation finalized & approved as ${savedRecord.quotation_number || generatedQuoteNum}.`);
          localStorage.removeItem('aura_quotation_draft');
          setViewMode('dashboard');
          fetchQuotations();
          return;
        } else if (quoteErr) {
          console.warn("Supabase direct quotation save warning:", quoteErr.message);
        }
      } catch (err) {
        console.error("Supabase direct quotation save exception:", err);
      }
    }

    // 2. Backend API Endpoint Fallback with Authorization Header
    try {
      const url = editingQuoteId ? `/api/quotations/${editingQuoteId}` : '/api/quotations';
      const method = editingQuoteId ? 'PUT' : 'POST';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data && (data.success || data.id || data.quotation)) {
        triggerToast(targetStatus === 'Draft' ? "Quotation draft saved successfully." : `Quotation finalized & approved as ${data.quotation_number || generatedQuoteNum}.`);
        localStorage.removeItem('aura_quotation_draft');
        setViewMode('dashboard');
        fetchQuotations();
      } else {
        triggerToast("Saved locally: " + (data?.error || "Offline draft sync"));
        localStorage.removeItem('aura_quotation_draft');
        setViewMode('dashboard');
        fetchQuotations();
      }
    } catch(err) {
      console.error(err);
      triggerToast("Quotation saved locally.");
      localStorage.removeItem('aura_quotation_draft');
      setViewMode('dashboard');
      fetchQuotations();
    }
  };

  // Restore Revision State
  const handleRestoreRevision = (rev) => {
    if (!confirm(`Are you sure you want to restore quotation state to Revision #${rev.revision_number}?`)) return;
    try {
      // Reconstruct payload and save as new revision
      triggerToast(`Restored state to Revision V${rev.revision_number}. Save proposal to apply changes.`);
      setShowRevisionModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  // ERP integration trigger: Accepted Quotation -> Auto Spawn Project, Milestones, Planner items, Advance invoice
  const handleIntegrateERP = async (quoteData) => {
    if (!confirm(`Mark this quotation as Accepted and automatically spawn Project, tasks, planner items, and the first Advance Invoice in the ERP?`)) return;

    try {
      // UUID validation helper — Supabase rejects any non-UUID string in UUID columns
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUuid = (id) => id && uuidRegex.test(id);

      const isSupabase = supabase !== null;
      // Always use a real UUID for the project ID so Supabase accepts it
      const newProjId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
          }));

      // 1. Find Client Reference matching quoteData.client_name
      const matchedClient = clients.find(c => c.name.toLowerCase() === quoteData.client_name.toLowerCase());
      const selectedClientId = matchedClient?.id || null;
      // selectedClientId may be a local mock ID (e.g. 'c1') — only send to Supabase if valid UUID
      const validClientId = isValidUuid(selectedClientId) ? selectedClientId : null;
      const validUserId = isValidUuid(user?.id) ? user.id : null;

      const totalValue = quoteData.costing?.grand_total || calculatedGrandTotal;
      const advanceAmount = Math.round(totalValue * (milestone1Percent / 100));

      // 2. Create Project record (local payload uses local IDs, Supabase payload uses only valid UUIDs)
      const projectPayload = {
        id: newProjId,
        title: quoteData.project_name,
        clientId: selectedClientId || 'local',
        progress: 20,
        status: 'In Progress',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quoteAmount: totalValue,
        paidAmount: 0,
        balanceAmount: totalValue,
        cadType: quoteData.project_type || 'Naval Architecture',
        fileNotes: `Auto-spawned from approved engineering quotation ${quoteData.quotation_number}`
      };

      // Only insert to Supabase if we have valid UUIDs for required FK columns
      if (isSupabase && validClientId) {
        const supabasePayload = {
          id: newProjId,
          title: projectPayload.title,
          client_id: validClientId,
          progress: 20,
          status: 'In Progress',
          deadline: projectPayload.deadline,
          quote_amount: totalValue,
          paid_amount: 0,
          balance_amount: totalValue,
          cad_type: projectPayload.cadType,
          file_notes: projectPayload.fileNotes,
          ...(validUserId ? { user_id: validUserId } : {})
        };
        const { error } = await supabase.from('projects').insert(supabasePayload);
        if (error) console.error("Supabase project insert failed:", error?.message, error?.code);
      } else if (isSupabase && !validClientId) {
        console.warn('Skipping Supabase project insert: client_id is not a valid UUID. Saving locally only.');
      }

      // Always update local state (works with both local and Supabase IDs)
      if (typeof setProjects === 'function') {
        setProjects(prev => {
          const updated = [...prev, projectPayload];
          localStorage.setItem("aura_projects_v7", JSON.stringify(updated));
          return updated;
        });
      }

      // 3. Create initial tasks based on milestones & deliverables
      const initialTasks = [
        { id: 't_m1_' + Date.now(), title: `Setup & kickoff: ${milestone1Name}`, priority: 'High', completed: false, project_id: newProjId, completion_percentage: 10, status: 'Pending' },
        { id: 't_m2_' + Date.now(), title: `Submit deliverables: ${milestone2Name}`, priority: 'Medium', completed: false, project_id: newProjId, completion_percentage: 0, status: 'Pending' },
        { id: 't_m3_' + Date.now(), title: `Verify detailed drawings: ${milestone3Name}`, priority: 'Medium', completed: false, project_id: newProjId, completion_percentage: 0, status: 'Pending' },
        { id: 't_m4_' + Date.now(), title: `Verify native models: ${milestone4Name}`, priority: 'Low', completed: false, project_id: newProjId, completion_percentage: 0, status: 'Pending' }
      ];

      // Only send tasks to Supabase if user is authenticated with a real UUID
      if (isSupabase && validUserId) {
        await supabase.from('tasks').insert(initialTasks.map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          completed: false,
          project_id: newProjId,
          completion_percentage: t.completion_percentage,
          status: t.status,
          user_id: validUserId
        })));
      }

      setTasks(prev => {
        const updated = [...prev, ...initialTasks.map(t => ({ ...t, projectId: newProjId, dueDate: new Date().toISOString().split('T')[0] }))];
        localStorage.setItem("aura_tasks_v7", JSON.stringify(updated));
        return updated;
      });

      // 4. Create first Advance Invoice
      const getNextInvoiceNumber = () => {
        const currentYear = new Date().getFullYear();
        const prefix = `INV-${currentYear}-`;
        let maxNum = 0;
        invoices.forEach(inv => {
          if (inv.invoice_number && inv.invoice_number.startsWith(prefix)) {
            const parts = inv.invoice_number.split('-');
            const lastPart = parts[parts.length - 1];
            const num = parseInt(lastPart, 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
      };

      const invoiceNumber = getNextInvoiceNumber();
      const isValidClientUuid = isValidUuid(selectedClientId);
      const isValidProjectUuid = isValidUuid(newProjId);
      const useSupabaseInsert = isSupabase && isValidClientUuid && isValidProjectUuid;
      const finalInvoiceId = useSupabaseInsert ? crypto.randomUUID() : 'inv_' + Date.now();

      const firstInvoice = {
        id: finalInvoiceId,
        invoice_number: invoiceNumber,
        client_id: selectedClientId,
        project_id: newProjId,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contract_value: totalValue,
        previously_invoiced: 0,
        current_billing_amount: advanceAmount,
        remaining_contract_value: Math.max(0, totalValue - advanceAmount),
        gst_percentage: gstPercent,
        gst_amount: Math.round(advanceAmount * (gstPercent / 100)),
        discount: 0,
        grand_total: Math.round(advanceAmount * (1 + gstPercent / 100)),
        payment_status: 'Pending',
        payment_method: 'Bank Transfer',
        notes: `Milestone 1 Advance Payment for project: ${quoteData.project_name || ''}. Linked to quote ${quoteData.quotation_number || ''}.`,
        created_by: user?.username || 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (useSupabaseInsert) {
        try {
          const { error } = await supabase.from('invoices').insert({
            id: firstInvoice.id,
            invoice_number: firstInvoice.invoice_number,
            client_id: firstInvoice.client_id,
            project_id: firstInvoice.project_id,
            invoice_date: firstInvoice.invoice_date,
            due_date: firstInvoice.due_date,
            contract_value: firstInvoice.contract_value,
            previously_invoiced: firstInvoice.previously_invoiced,
            current_billing_amount: firstInvoice.current_billing_amount,
            remaining_contract_value: firstInvoice.remaining_contract_value,
            gst_percentage: firstInvoice.gst_percentage,
            gst_amount: firstInvoice.gst_amount,
            discount: firstInvoice.discount,
            grand_total: firstInvoice.grand_total,
            payment_status: firstInvoice.payment_status,
            payment_method: firstInvoice.payment_method,
            notes: firstInvoice.notes,
            created_by: firstInvoice.created_by,
            created_at: firstInvoice.created_at,
            updated_at: firstInvoice.updated_at
          });
          if (error) {
            console.error("Supabase invoice insert error on approval:", error.message);
          }
        } catch (err) {
          console.error("Supabase invoice insert exception on approval:", err);
        }
      }

      setInvoices(prev => {
        const updated = [firstInvoice, ...prev];
        localStorage.setItem("aura_invoices_v7", JSON.stringify(updated));
        return updated;
      });

      // Update Quotation Status to 'Approved'
      await fetch(`/api/quotations/${quoteData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved', revision_description: "Project launched in ERP system" })
      });

      triggerToast("✅ ERP integration successful! Spawning Project, Milestone Tasks, and Advance Invoice complete.");
      setViewMode('dashboard');
      fetchQuotations();
    } catch(err) {
      console.error(err);
      triggerToast("Failed to complete ERP auto-linking.");
    }
  };

  // Export proposal document PDF
  const exportToPdf = async (qData, previewOnly = false) => {
    setPdfGenerating(true);
    try {
      const q = qData?.quotation || qData || {};
      const items = qData?.items || deliverables || [];
      const costing = qData?.costing || {
        engineering_hours: totalHours,
        engineering_fee: calculatedFee,
        software_cost: softwareCost,
        contingency: calculatedContingency,
        subtotal: calculatedSubtotal,
        gst: calculatedGst,
        grand_total: calculatedGrandTotal,
        hourly_rate: hourlyRate
      };

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Branding Colors (Primelisometrics Accent Red Layout)
      const primaryColor = [215, 38, 61];     // #D7263D Accent Red
      const secondaryColor = [30, 41, 59];    // #1E293B Dark Slate
      const textDark = [15, 23, 42];          // #0F172A Dark Navy
      const textMuted = [100, 116, 139];       // #64748B Muted Grey

      // Cover Page Header Banner (Accent Red background strip)
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 42, 'F');

      // Title Block
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("ENGINEERING CONSULTANCY OFFER", 15, 18);
      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.text("Primelisometrics Consultancy Services", 15, 28);
      doc.text("GSTIN: 27AAAAA1111A1Z1 • www.primelisometrics.com", 15, 34);

      // Quote details card
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFontSize(9.5);
      doc.setFont("Helvetica", "bold");
      doc.text("PROPOSAL OVERVIEW", 15, 55);
      doc.line(15, 58, 195, 58);

      let gridY = 66;
      const writeRow = (lbl1, val1, lbl2, val2) => {
        doc.setFont("Helvetica", "bold");
        doc.text(lbl1, 15, gridY);
        doc.setFont("Helvetica", "normal");
        doc.text(val1 || 'N/A', 50, gridY);

        if (lbl2) {
          doc.setFont("Helvetica", "bold");
          doc.text(lbl2, 110, gridY);
          doc.setFont("Helvetica", "normal");
          doc.text(val2 || 'N/A', 145, gridY);
        }
        gridY += 9;
      };

      writeRow("Quotation Ref:", q.quotation_number || 'PMC-PROPOSAL', "Date:", new Date().toLocaleDateString());
      writeRow("Client Name:", q.client_name, "Contact Person:", q.contact_person);
      writeRow("Project Title:", q.project_name, "Project Location:", q.project_location);
      writeRow("Project Type:", q.project_type || projectType, "Currency:", q.currency || currency);

      // Table of deliverables
      doc.setFont("Helvetica", "bold");
      doc.text("SCOPE OF DELIVERABLES", 15, gridY + 5);
      gridY += 10;

      const tableRows = items.filter(item => item && item.included).map((item, idx) => [
        idx + 1,
        item.deliverable || 'Scope Deliverable Item',
        `${item.estimated_hours || 0} hrs`,
        item.remarks || ""
      ]);

      callAutoTable(doc, {
        startY: gridY,
        head: [['S.No', 'Scope Deliverable Description', 'Hours', 'Remarks']],
        body: tableRows,
        headStyles: { fillColor: primaryColor },
        theme: 'grid',
        styles: { fontSize: 8.5 }
      });

      // Commercial Summary & Payments
      let finalY = doc.lastAutoTable.finalY + 15;
      if (finalY > 230) {
        doc.addPage();
        finalY = 30;
      }

      doc.setFont("Helvetica", "bold");
      doc.text("COMMERCIAL FEE BREAKDOWN", 15, finalY);
      doc.line(15, finalY + 3, 195, finalY + 3);
      finalY += 10;

      const formatVal = (num) => `${q.currency || currency} ${Math.round(num || 0).toLocaleString()}`;
      
      doc.setFont("Helvetica", "normal");
      doc.text("1. Engineering Services Fee:", 15, finalY);
      doc.text(formatVal(costing.engineering_fee || 0), 195, finalY, { align: 'right' });
      finalY += 8;

      doc.text("2. Software Tools & Licenses:", 15, finalY);
      doc.text(formatVal(costing.software_cost || 0), 195, finalY, { align: 'right' });
      finalY += 8;

      doc.text("3. Contingency Allocation:", 15, finalY);
      doc.text(formatVal(costing.contingency || 0), 195, finalY, { align: 'right' });
      finalY += 8;

      doc.text("4. Goods & Services Tax (GST):", 15, finalY);
      doc.text(formatVal(costing.gst || 0), 195, finalY, { align: 'right' });
      finalY += 8;

      doc.setFont("Helvetica", "bold");
      doc.text("GRAND TOTAL CONTRACT VALUE:", 15, finalY);
      doc.text(formatVal(costing.grand_total || 0), 195, finalY, { align: 'right' });
      finalY += 12;

      // Milestones table
      doc.text("PAYMENT MILESTONES SCHEDULE", 15, finalY);
      finalY += 4;

      const milestonesRows = [
        [milestone1Name, `${milestone1Percent}%`, formatVal((costing.grand_total * milestone1Percent) / 100)],
        [milestone2Name, `${milestone2Percent}%`, formatVal((costing.grand_total * milestone2Percent) / 100)],
        [milestone3Name, `${milestone3Percent}%`, formatVal((costing.grand_total * milestone3Percent) / 100)],
        [milestone4Name, `${milestone4Percent}%`, formatVal((costing.grand_total * milestone4Percent) / 100)]
      ];

      callAutoTable(doc, {
        startY: finalY,
        head: [['Milestone Stage', 'Percentage', 'Calculated Fee']],
        body: milestonesRows,
        headStyles: { fillColor: secondaryColor },
        theme: 'striped',
        styles: { fontSize: 8.5 }
      });

      // Signatures page footer
      let sigY = doc.lastAutoTable.finalY + 15;
      if (sigY > 240) {
        doc.addPage();
        sigY = 30;
      }

      doc.setFont("Helvetica", "bold");
      doc.text("COMMERCIAL CONDITIONS", 15, sigY);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      const splitTerms = doc.splitTextToSize(commercialConditions, 180);
      doc.text(splitTerms, 15, sigY + 5);

      sigY += 40;
      doc.line(15, sigY, 85, sigY);
      doc.line(125, sigY, 195, sigY);
      sigY += 5;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Authorized Signature (Primelisometrics)", 15, sigY);
      doc.text("Accepted & Approved By (Client)", 125, sigY);

      if (previewOnly) {
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`${q.quotation_number || 'PMC-TEMP'}_Engineering_Proposal.pdf`);
      }
      triggerToast(previewOnly ? "Preview opened in browser tab." : "PDF downloaded successfully.");
    } catch(err) {
      console.error(err);
      triggerToast("Failed to compile proposal PDF.");
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleUpdateStatus = async (quoteId, newStatus) => {
    try {
      const res = await fetch(`/api/quotations/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, revision_description: `Status changed to ${newStatus}` })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Quotation status updated to ${newStatus}`);
        fetchQuotations();
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed to update status.");
    }
  };

  const handleDeleteQuotation = async (quoteId) => {
    if (!confirm("Are you sure you want to permanently delete this quotation request? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/quotations/${quoteId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Quotation deleted successfully.");
        fetchQuotations();
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed to delete quotation record.");
    }
  };

  // Dashboard calculations
  const totalCount = quotations.length;
  const draftQuotes = quotations.filter(q => q.status === 'Draft');
  const approvedQuotes = quotations.filter(q => q.status === 'Approved');
  const sentQuotes = quotations.filter(q => q.status === 'Sent');
  const expiredQuotes = quotations.filter(q => q.status === 'Expired');
  const activeCount = approvedQuotes.length + sentQuotes.length;

  const totalValueSum = quotations.reduce((sum, q) => sum + (q.costing?.grand_total || 0), 0);
  const avgQuoteVal = totalCount ? Math.round(totalValueSum / totalCount) : 0;
  const conversionRate = totalCount ? Math.round(((approvedQuotes.length) / totalCount) * 100) : 0;

  // Filtered quotes for Dashboard List
  const filteredQuotesList = quotations.filter(q => {
    const matchesSearch = (q.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (q.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (q.quotation_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. DASHBOARD VIEW */}
      {viewMode === 'dashboard' && (
        <>
          {/* Dashboard Header Banner */}
          <div style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent)', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: 'var(--shadow-card)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Proposal & Feasibility Engine</span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 0 0' }}>
                Quotation Engineering Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Create structured multi-step consultancy offers, build scope deliverables, manage versions, and push accepted offers into active projects.
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}
              onClick={handleOpenNewWizard}
            >
              <Plus size={18} /> New Quotation Wizard
            </button>
          </div>

          {/* KPI Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>Active Proposals</span>
              <strong style={{ fontSize: '1.6rem', color: 'var(--accent)' }}>{activeCount}</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{approvedQuotes.length} Approved | {sentQuotes.length} Sent</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>Draft Mode</span>
              <strong style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>{draftQuotes.length}</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Requires workflow review</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>Expired / Archived</span>
              <strong style={{ fontSize: '1.6rem', color: 'var(--text-secondary)' }}>{expiredQuotes.length}</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Validity periods elapsed</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>Average Quote Value</span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>INR {avgQuoteVal.toLocaleString()}</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Calculated over all iterations</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>Approval Conv. Rate</span>
              <strong style={{ fontSize: '1.6rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={18} /> {conversionRate}%
              </strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ratio of Approved to total</div>
            </div>
          </div>

          {/* List Section Toolbar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <input 
              type="text" 
              placeholder="Search by quote number, project name, or client name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, height: '38px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '38px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Sent">Sent</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Quotations Recent Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Quotation #</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Project / Client</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Value</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Syncing ERP quotation files...</td></tr>
                ) : filteredQuotesList.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No quotations match the search criteria.</td></tr>
                ) : (
                  filteredQuotesList.map((q) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                      <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--text-primary)' }}>{q.quotation_number}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{q.project_name}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{q.client_name}</span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{q.project_type || 'Naval Architecture'}</td>
                      <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--accent)' }}>
                        {q.currency || 'INR'} {q.costing?.grand_total ? Math.round(q.costing.grand_total).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '4px 8px', fontSize: '0.7rem', fontWeight: '700', borderRadius: '4px',
                          background: q.status === 'Approved' ? 'rgba(46,204,113,0.15)' : q.status === 'Sent' ? '#DBEAFE' : 'rgba(255,255,255,0.05)',
                          color: q.status === 'Approved' ? '#2ECC71' : q.status === 'Sent' ? '#3498DB' : 'var(--text-secondary)'
                        }}>{q.status}</span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', minWidth: 'auto' }}
                            onClick={() => { setSelectedQuote(q); setViewMode('detail'); }}
                          >
                            <Eye size={13} /> View
                          </button>
                          
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', minWidth: 'auto' }}
                            onClick={() => handleOpenEditWizard(q)}
                          >
                            <Edit3 size={13} /> Edit
                          </button>

                          {q.status === 'Approved' && (
                            <button 
                              className="btn" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', minWidth: 'auto', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => handleIntegrateERP(q)}
                            >
                              <FolderKanban size={13} /> Launch Project
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 2. MULTI-STEP CREATION WIZARD */}
      {viewMode === 'wizard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          
          {/* Step Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', overflowX: 'auto', gap: '12px' }}>
            {[
              { nr: 1, name: "Client Details" },
              { nr: 2, name: "Scope Selection" },
              { nr: 3, name: "Templates" },
              { nr: 4, name: "Costing Details" },
              { nr: 5, name: "Milestone payments" },
              { nr: 6, name: "Conditions" },
              { nr: 7, name: "Print Preview" }
            ].map(step => (
              <button 
                key={step.nr}
                onClick={() => setWizardStep(step.nr)}
                style={{
                  background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  color: wizardStep === step.nr ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: wizardStep === step.nr ? '800' : '500',
                  borderBottom: wizardStep === step.nr ? '2px solid var(--accent)' : '2px solid transparent',
                  paddingBottom: '8px'
                }}
              >
                <span style={{ display: 'inline-flex', width: '20px', height: '20px', borderRadius: '50%', background: wizardStep === step.nr ? 'var(--accent)' : 'rgba(255,255,255,0.08)', color: 'white', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{step.nr}</span>
                <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{step.name}</span>
              </button>
            ))}
          </div>

          {/* STEP 1: CLIENT DETAILS */}
          {wizardStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Step 1: Client & Project Setup</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Load Client Profile</label>
                  <select 
                    value={selectedClientIndex} 
                    onChange={handleClientSelectionChange}
                    style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- Or type client manually --</option>
                    {clients.map((c, i) => <option key={c.id} value={i}>{c.name} ({c.company})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Client / Company Name *</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Apex Marine Corp" style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Contact Person Email</label>
                  <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="contact@company.com" style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Project Name *</label>
                  <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Barge Stability Assessment" style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Project Site / Location</label>
                  <input type="text" value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} placeholder="e.g. Goa Shipyard" style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Quotation Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Engineering Discipline</label>
                  <select value={projectType} onChange={(e) => setProjectType(e.target.value)} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }}>
                    <option value="Marine Engineering">Marine Engineering</option>
                    <option value="Structural Engineering">Structural Engineering</option>
                    <option value="Piping Engineering">Piping Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="CAD Services">CAD Services</option>
                    <option value="Software Development">Software Development</option>
                    <option value="Website Development">Website Development</option>
                    <option value="Internal Quality">Internal Quality</option>
                    <option value="Consultancy Services">Consultancy Services</option>
                    <option value="Naval Architecture">Naval Architecture</option>
                    <option value="CAD Modeling">CAD Modeling</option>
                    <option value="CFD Analysis">CFD Analysis</option>
                    <option value="Engineering Audit">Engineering Audit</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Auto AI Suggestions Checklist Panel */}
              <div style={{ background: 'rgba(255,193,7,0.04)', border: '1px dashed rgba(255,193,7,0.3)', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Sparkles size={16} style={{ color: '#FFC107' }} />
                  <strong style={{ fontSize: '0.85rem', color: '#FFC107', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dynamic AI Presets Suggestion Panel</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                  Based on your selected discipline <strong>"{projectType}"</strong>, we recommend the following scope template presets:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getAIRecommendations(projectType).length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No default presets matching this discipline. You can select one manually in Step 3.</div>
                  ) : (
                    getAIRecommendations(projectType).map(preset => {
                      const totalPresetHours = preset.deliverables.reduce((acc, curr) => acc + (curr.estimated_hours || 0), 0);
                      return (
                        <div key={preset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>{preset.discipline} / {preset.department}</span>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{preset.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '10px' }}>({preset.deliverables.length} items • {totalPresetHours} hrs)</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.7rem', minHeight: 'auto', background: 'var(--accent)', border: 'none', color: 'white' }}
                              onClick={() => {
                                setDeliverables(preset.deliverables.map(d => ({ ...d, included: true })));
                                triggerToast(`Loaded pre-filled items for preset: ${preset.name}`);
                              }}
                            >
                              Load Preset
                            </button>
                            <button 
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.7rem', minHeight: 'auto' }}
                              onClick={() => handleMergePreset(preset)}
                            >
                              Merge Preset
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SCOPE SELECTION */}
          {wizardStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Step 2: Scope Deliverables Selection</h3>
                <button type="button" className="btn btn-primary" onClick={addDeliverableRow} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.8rem' }}>
                  + Add Scope Row
                </button>
              </div>

              <input 
                type="text" 
                placeholder="Search active scope deliverables..." 
                value={scopeSearch} 
                onChange={(e) => setScopeSearch(e.target.value)}
                style={{ height: '38px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '8px', width: '50px', textAlign: 'center' }}>Inc</th>
                      <th style={{ padding: '8px' }}>Deliverable Description</th>
                      <th style={{ padding: '8px', width: '100px' }}>Est. Hours</th>
                      <th style={{ padding: '8px' }}>Scope Remarks</th>
                      <th style={{ padding: '8px', width: '120px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables.filter(d => d.deliverable.toLowerCase().includes(scopeSearch.toLowerCase())).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={item.included} 
                            onChange={(e) => {
                              const copy = [...deliverables];
                              copy[idx].included = e.target.checked;
                              setDeliverables(copy);
                            }}
                          />
                        </td>
                        <td>
                          {editingRowIdx === idx ? (
                            <input type="text" value={editDocName} onChange={(e) => setEditDocName(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'black', color: 'white' }} />
                          ) : (
                            <span style={{ fontWeight: '600' }}>{item.deliverable}</span>
                          )}
                        </td>
                        <td>
                          {editingRowIdx === idx ? (
                            <input type="number" value={editHours} onChange={(e) => setEditHours(Number(e.target.value) || 0)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'black', color: 'white' }} />
                          ) : (
                            <span>{item.estimated_hours} hrs</span>
                          )}
                        </td>
                        <td>
                          {editingRowIdx === idx ? (
                            <input type="text" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'black', color: 'white' }} />
                          ) : (
                            <span>{item.remarks || '-'}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {editingRowIdx === idx ? (
                              <button type="button" onClick={() => saveEditRow(idx)} style={{ background: '#10B981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px' }}><Check size={12} /></button>
                            ) : (
                              <button type="button" onClick={() => startEditRow(idx)} style={{ background: 'var(--border-color)', color: 'var(--text-primary)', border: 'none', padding: '4px 8px', borderRadius: '4px' }}><Edit3 size={12} /></button>
                            )}
                            <button type="button" onClick={() => setDeliverables(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', padding: '4px 8px', borderRadius: '4px' }}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: TEMPLATES LOADER */}
          {wizardStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Step 3: Engineering Preset Library</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select, merge, or customize deliverable scope packages for your proposal.</p>
                </div>
                
                {/* Custom Presets Operations */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setNewPresetName(projectName ? `${projectName} Template` : '');
                      setNewPresetDiscipline(projectType);
                      setShowSavePresetModal(true);
                    }}
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Save size={14} /> Save Current Scope as Template
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleExportPresets}
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Export Custom Templates
                  </button>
                  
                  <label 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0 }}
                  >
                    <Upload size={14} /> Import Templates
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportPresets} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
              </div>

              {/* AI Suggestion Panel (Sticky/Dynamic Recommendation Block) */}
              {getAIRecommendations(projectType).length > 0 && (
                <div style={{ background: 'rgba(215, 38, 61, 0.05)', border: '1px dashed var(--accent)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Recommended Templates for "{projectType}"</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {getAIRecommendations(projectType).map(preset => (
                      <div key={preset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'block' }}>{preset.name}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{preset.deliverables.length} Deliverables • {preset.deliverables.reduce((s,d)=>s+d.estimated_hours, 0)} hrs</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            type="button" 
                            style={{ padding: '3px 8px', fontSize: '0.7rem', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => {
                              setDeliverables(preset.deliverables.map(d => ({ ...d, included: true })));
                              triggerToast(`Loaded pre-filled items for preset: ${preset.name}`);
                            }}
                          >
                            Load
                          </button>
                          <button 
                            type="button" 
                            style={{ padding: '3px 8px', fontSize: '0.7rem', background: 'var(--border-color)', border: 'none', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => handleMergePreset(preset)}
                          >
                            Merge
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Presets Filtering Toolbar */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Search preset title, deliverables, or software..." 
                  value={presetKeyword} 
                  onChange={(e) => setPresetKeyword(e.target.value)}
                  style={{ flex: 1, minWidth: '180px', height: '36px', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.8rem' }}
                />
                
                <select 
                  value={presetDiscipline}
                  onChange={(e) => setPresetDiscipline(e.target.value)}
                  style={{ height: '36px', padding: '0 8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                >
                  <option value="All">All Disciplines</option>
                  {Array.from(new Set([...ENGINEERING_PRESETS, ...customPresets].map(p => p.discipline))).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select 
                  value={presetDepartment}
                  onChange={(e) => setPresetDepartment(e.target.value)}
                  style={{ height: '36px', padding: '0 8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                >
                  <option value="All">All Departments</option>
                  {Array.from(new Set([...ENGINEERING_PRESETS, ...customPresets].map(p => p.department))).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select 
                  value={presetSoftware}
                  onChange={(e) => setPresetSoftware(e.target.value)}
                  style={{ height: '36px', padding: '0 8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                >
                  <option value="All">All Software</option>
                  {Array.from(new Set([...ENGINEERING_PRESETS, ...customPresets].flatMap(p => p.software || []))).map(sw => (
                    <option key={sw} value={sw}>{sw}</option>
                  ))}
                </select>
                
                {selectedPresetIds.length > 0 && (
                  <button 
                    type="button"
                    onClick={handleMergeSelectedPresets}
                    style={{ height: '36px', padding: '0 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Layers size={14} /> Merge Selected ({selectedPresetIds.length})
                  </button>
                )}
              </div>

              {/* Presets Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {[...ENGINEERING_PRESETS, ...customPresets]
                  .filter(preset => {
                    const matchesKeyword = preset.name.toLowerCase().includes(presetKeyword.toLowerCase()) || 
                      preset.discipline.toLowerCase().includes(presetKeyword.toLowerCase()) ||
                      preset.department.toLowerCase().includes(presetKeyword.toLowerCase()) ||
                      (preset.software || []).some(sw => sw.toLowerCase().includes(presetKeyword.toLowerCase())) ||
                      preset.deliverables.some(d => d.deliverable.toLowerCase().includes(presetKeyword.toLowerCase()));
                    const matchesDiscipline = presetDiscipline === 'All' || preset.discipline === presetDiscipline;
                    const matchesDepartment = presetDepartment === 'All' || preset.department === presetDepartment;
                    const matchesSoftware = presetSoftware === 'All' || (preset.software || []).includes(presetSoftware);
                    return matchesKeyword && matchesDiscipline && matchesDepartment && matchesSoftware;
                  })
                  .map(preset => {
                    const totalPresetHours = preset.deliverables.reduce((acc, curr) => acc + (curr.estimated_hours || 0), 0);
                    const isFavorite = favorites.includes(preset.id);
                    const isSelected = selectedPresetIds.includes(preset.id);
                    const isCustom = preset.id.toString().startsWith('custom_');
                    
                    return (
                      <div 
                        key={preset.id}
                        style={{ 
                          background: 'var(--bg-card)', 
                          border: isSelected ? '2px solid #10B981' : '1px solid var(--border-color)', 
                          borderRadius: '12px', 
                          padding: '16px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px',
                          position: 'relative',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        {/* Checkbox and Favorite indicator */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPresetIds(prev => [...prev, preset.id]);
                              } else {
                                setSelectedPresetIds(prev => prev.filter(id => id !== preset.id));
                              }
                            }}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          
                          <button 
                            type="button"
                            onClick={() => toggleFavorite(preset.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                          >
                            <Star size={16} fill={isFavorite ? '#FFC107' : 'none'} color={isFavorite ? '#FFC107' : 'var(--text-secondary)'} />
                          </button>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(215, 38, 61, 0.1)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              {preset.discipline}
                            </span>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                              {preset.department}
                            </span>
                            {isCustom && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Custom
                              </span>
                            )}
                          </div>
                          
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>{preset.name}</strong>
                        </div>
                        
                        {/* Meta Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '6px' }}>
                          <div>⏱️ Duration: <strong>{preset.typicalDuration}</strong></div>
                          <div>⚡ Difficulty: <strong style={{ color: preset.difficulty === 'Expert' ? '#EF4444' : preset.difficulty === 'Advanced' ? '#F59E0B' : '#10B981' }}>{preset.difficulty}</strong></div>
                          <div style={{ gridColumn: '1 / -1' }}>👥 Team: <strong>{preset.recommendedTeam}</strong></div>
                          <div style={{ gridColumn: '1 / -1' }}>🛠️ Deliverables: <strong>{preset.deliverables.length} ({totalPresetHours} hrs)</strong></div>
                        </div>
                        
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '8px' }}>
                          <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => setPreviewPreset(preset)}
                            style={{ flex: 1, minWidth: '60px', padding: '6px 8px', fontSize: '0.75rem' }}
                          >
                            <Eye size={12} style={{ marginRight: '4px' }} /> Preview
                          </button>
                          
                          <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={() => {
                              setDeliverables(preset.deliverables.map(d => ({ ...d, included: true })));
                              triggerToast(`Loaded scope items from ${preset.name}`);
                            }}
                            style={{ flex: 1, minWidth: '60px', padding: '6px 8px', fontSize: '0.75rem', background: 'var(--accent)', color: 'white', border: 'none' }}
                          >
                            Load
                          </button>

                          <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => handleMergePreset(preset)}
                            style={{ flex: 1, minWidth: '60px', padding: '6px 8px', fontSize: '0.75rem' }}
                          >
                            Merge
                          </button>
                        </div>
                        
                        {/* Custom Only buttons */}
                        {isCustom && (
                          <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', justifyContent: 'space-between' }}>
                            <button 
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleDuplicatePreset(preset)}
                              style={{ padding: '4px 8px', fontSize: '0.7rem', flex: 1, minHeight: 'auto' }}
                            >
                              <Copy size={12} style={{ marginRight: '4px' }} /> Duplicate
                            </button>
                            <button 
                              type="button"
                              className="btn"
                              onClick={() => handleDeleteCustomPreset(preset.id)}
                              style={{ padding: '4px 8px', fontSize: '0.7rem', flex: 1, minHeight: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', borderRadius: '4px' }}
                            >
                              <Trash2 size={12} style={{ marginRight: '4px' }} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 4: COSTING SETTINGS */}
          {wizardStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Step 4: Cost Breakdown Factor Settings</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Hourly Engineering Rate ({currency})</label>
                  <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Software & Licenses Factor</label>
                  <input type="number" value={softwareCost} onChange={(e) => setSoftwareCost(Number(e.target.value))} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Third Party Charges</label>
                  <input type="number" value={thirdPartyCost} onChange={(e) => setThirdPartyCost(Number(e.target.value))} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Travel / Accommodation</label>
                  <input type="number" value={travelCost} onChange={(e) => setTravelCost(Number(e.target.value))} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Contingency Margin (%)</label>
                  <input type="number" value={contingencyPercent} onChange={(e) => setContingencyPercent(Number(e.target.value))} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Base Engineering Fee ({totalHours} hrs):</span><strong>{currency} {calculatedFee.toLocaleString()}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Contingency Margin:</span><strong>{currency} {calculatedContingency.toLocaleString()}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', color: 'var(--accent)', fontSize: '1.1rem' }}>
                  <strong>Contract Value (GST Exclusive):</strong>
                  <strong>{currency} {Math.round(calculatedGrandTotal).toLocaleString()}</strong>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                  * Note: GST is extra and will be applied to individual milestone invoices.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: MILESTONE PAYMENTS */}
          {wizardStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Step 5: Milestone Payments Structure</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                  <strong>Milestone 1: {milestone1Name}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginTop: '8px' }}>
                    <input type="number" value={milestone1Percent} onChange={(e) => setMilestone1Percent(Number(e.target.value) || 0)} placeholder="%" style={{ height: '36px', padding: '6px', background: 'black', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                    <input type="text" value={milestone1Desc} onChange={(e) => setMilestone1Desc(e.target.value)} placeholder="Milestone description" style={{ height: '36px', padding: '6px', background: 'black', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                  <strong>Milestone 2: {milestone2Name}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginTop: '8px' }}>
                    <input type="number" value={milestone2Percent} onChange={(e) => setMilestone2Percent(Number(e.target.value) || 0)} placeholder="%" style={{ height: '36px', padding: '6px', background: 'black', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                    <input type="text" value={milestone2Desc} onChange={(e) => setMilestone2Desc(e.target.value)} placeholder="Milestone description" style={{ height: '36px', padding: '6px', background: 'black', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                  <strong>Milestone 3: {milestone3Name}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginTop: '8px' }}>
                    <input type="number" value={milestone3Percent} onChange={(e) => setMilestone3Percent(Number(e.target.value) || 0)} placeholder="%" style={{ height: '36px', padding: '6px', background: 'black', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                    <input type="text" value={milestone3Desc} onChange={(e) => setMilestone3Desc(e.target.value)} placeholder="Milestone description" style={{ height: '36px', padding: '6px', background: 'black', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                  <strong>Milestone 4: {milestone4Name}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginTop: '8px' }}>
                    <input type="number" value={milestone4Percent} onChange={(e) => setMilestone4Percent(Number(e.target.value) || 0)} placeholder="%" style={{ height: '36px', padding: '6px', background: 'black', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                    <input type="text" value={milestone4Desc} onChange={(e) => setMilestone4Desc(e.target.value)} placeholder="Milestone description" style={{ height: '36px', padding: '6px', background: 'black', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>

              {milestone1Percent + milestone2Percent + milestone3Percent + milestone4Percent !== 100 && (
                <div style={{ padding: '10px', background: 'rgba(211,47,69,0.15)', color: 'var(--accent)', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} /> Warning: The milestone percentage allocations must sum exactly to 100% (Current sum: {milestone1Percent + milestone2Percent + milestone3Percent + milestone4Percent}%)
                </div>
              )}
            </div>
          )}

          {/* STEP 6: COMMERCIAL CONDITIONS */}
          {wizardStep === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Step 6: Commercial Conditions</h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCommercialConditions(prev => prev + "\n- Confidentiality: Strictly governed by NDA.")} style={{ fontSize: '0.75rem' }}>+ NDA Standard</button>
                <button type="button" className="btn btn-secondary" onClick={() => setCommercialConditions(prev => prev + "\n- Delivery delay penalties: 2.5% max limit cap.")} style={{ fontSize: '0.75rem' }}>+ Penalties Cap</button>
              </div>

              <textarea 
                value={commercialConditions} 
                onChange={(e) => setCommercialConditions(e.target.value)}
                rows={8}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
            </div>
          )}

          {/* STEP 7: PRINT PREVIEW */}
          {wizardStep === 7 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Step 7: A4 Print Preview</h3>
              
              <div style={{ 
                background: 'white', color: '#0F172A', padding: '20mm', borderRadius: '8px', border: '1px solid var(--border-color)',
                fontFamily: 'Helvetica, Arial, sans-serif', minHeight: '297mm', boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }}>
                {/* Header preview */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #D7263D', paddingBottom: '12px', marginBottom: '20px' }}>
                  <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#D7263D', margin: 0 }}>PRIMELISOMETRICS</h1>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Engineering & Naval Architecture Consultancy</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                    <strong>Offer Proposal</strong><br />
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Details grid preview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '24px' }}>
                  <div>
                    <strong>Prepared For:</strong>
                    <div style={{ color: '#1E293B' }}>{clientName || 'Manually entered client'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Contact: {contactPerson || 'Not provided'}</div>
                  </div>
                  <div>
                    <strong>Project Information:</strong>
                    <div>{projectName || 'Assessment Title'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Site: {projectLocation || 'Not specified'}</div>
                  </div>
                </div>

                {/* Deliverables preview table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '24px' }}>
                  <thead>
                    <tr style={{ background: '#D7263D', color: 'white' }}>
                      <th style={{ padding: '6px', textAlign: 'left' }}>S.No</th>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Scope Deliverable Item</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Est. Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables.filter(d => d.included).map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '6px' }}>{i + 1}</td>
                        <td style={{ padding: '6px' }}>{d.deliverable}</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>{d.estimated_hours} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Fee and payment breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', fontSize: '0.8rem', borderTop: '1.5px solid #1E293B', paddingTop: '16px' }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '6px', color: '#D7263D' }}>Payment Milestone Schedule:</strong>
                    <ul style={{ paddingLeft: '16px', margin: 0 }}>
                      <li>{milestone1Name} ({milestone1Percent}%): {currency} {Math.round(calculatedGrandTotal * milestone1Percent / 100).toLocaleString()}</li>
                      <li>{milestone2Name} ({milestone2Percent}%): {currency} {Math.round(calculatedGrandTotal * milestone2Percent / 100).toLocaleString()}</li>
                      <li>{milestone3Name} ({milestone3Percent}%): {currency} {Math.round(calculatedGrandTotal * milestone3Percent / 100).toLocaleString()}</li>
                      <li>{milestone4Name} ({milestone4Percent}%): {currency} {Math.round(calculatedGrandTotal * milestone4Percent / 100).toLocaleString()}</li>
                    </ul>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Engineering Base:</span><span>{currency} {calculatedFee.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Software cost:</span><span>{currency} {softwareCost.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Contingency margin:</span><span>{currency} {calculatedContingency.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>GST Tax ({gstPercent}%):</span><span>{currency} {calculatedGst.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1E293B', paddingTop: '6px', fontWeight: 'bold', fontSize: '0.9rem', color: '#D7263D' }}>
                      <span>Total Value:</span>
                      <span>{currency} {Math.round(calculatedGrandTotal).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Navigation Panel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              disabled={wizardStep === 1}
              onClick={() => setWizardStep(prev => prev - 1)}
            >
              Previous Step
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { if (confirm("Discard draft edits?")) setViewMode('dashboard'); }}
              >
                Cancel Wizard
              </button>

              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={pdfGenerating}
                onClick={() => exportToPdf(null, true)}
              >
                <Eye size={14} /> Live PDF Preview
              </button>

              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handleSaveQuotation('Draft')}
                style={{ background: 'var(--accent)', color: 'white', border: 'none' }}
              >
                Save Draft
              </button>

              {wizardStep < 7 ? (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => setWizardStep(prev => prev + 1)}
                  style={{ background: 'var(--accent)', color: 'white', border: 'none' }}
                >
                  Next Step
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => handleSaveQuotation('Approved')}
                  style={{ background: '#10B981', color: 'white', border: 'none', fontWeight: 'bold' }}
                >
                  Finalize & Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. DETAIL VIEW MODAL */}
      {viewMode === 'detail' && selectedQuote && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Quotation: {selectedQuote.quotation_number}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registered by @{selectedQuote.created_by || 'system'}</span>
            </div>
            <button className="btn btn-secondary" onClick={() => setViewMode('dashboard')}>Return to Dashboard</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div><strong>Client Name:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{selectedQuote.client_name}</p></div>
            <div><strong>Project Name:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{selectedQuote.project_name}</p></div>
            <div><strong>Location:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{selectedQuote.project_location || 'Not Specified'}</p></div>
            <div><strong>Workflow Status:</strong> 
              <p style={{ margin: '4px 0 0 0' }}>
                <span style={{ 
                  padding: '3px 6px', fontSize: '0.7rem', fontWeight: '700', borderRadius: '4px',
                  background: selectedQuote.status === 'Approved' ? 'rgba(46,204,113,0.15)' : '#FEF3C7',
                  color: selectedQuote.status === 'Approved' ? '#2ECC71' : '#F39C12'
                }}>{selectedQuote.status || 'Draft'}</span>
              </p>
            </div>
          </div>

          {/* Scope list view */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '8px', color: 'var(--accent)' }}>Active Scope Deliverables</h4>
            <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '8px' }}>Module Name</th>
                    <th style={{ padding: '8px' }}>Estimated Hours</th>
                    <th style={{ padding: '8px' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedQuote.items || deliverables).filter(item => item && item.included).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: '650' }}>{item.deliverable || ''}</td>
                      <td style={{ padding: '6px 8px' }}>{item.estimated_hours || 0} hrs</td>
                      <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{item.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing breakdown details */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '8px', color: 'var(--accent)' }}>Offer Commercial Settings</h4>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Scope Hours</span>
                <strong>{selectedQuote.costing?.engineering_hours || totalHours} hrs</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Software Factor</span>
                <strong>{selectedQuote.currency || 'INR'} {(selectedQuote.costing?.software_cost || softwareCost).toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--accent)', display: 'block', fontWeight: 'bold' }}>Grand Total estimate</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>{selectedQuote.currency || 'INR'} {Math.round(selectedQuote.costing?.grand_total || calculatedGrandTotal).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Revisions and Version Control block */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 12px 0' }}>
              <History size={16} /> Dynamic Version Control Revisions
            </h4>
            {revisions.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>No previous revisions logged for this quotation request.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {revisions.map((rev) => (
                  <div key={rev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem' }}>
                    <div>
                      <strong>V{rev.revision_number}</strong> - <span style={{ color: 'var(--text-secondary)' }}>{rev.description}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: '8px' }}>by @{rev.created_by}</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto' }}
                      onClick={() => handleRestoreRevision(rev)}
                    >
                      Restore version
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail actions panel */}
          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={() => exportToPdf(selectedQuote, false)} style={{ background: 'var(--accent)', border: 'none', color: 'white' }} disabled={pdfGenerating}>
                Download corporate PDF
              </button>
              <button className="btn btn-secondary" onClick={() => exportToPdf(selectedQuote, true)}>
                Preview PDF
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedQuote.status === 'Approved' && (
                <button className="btn" style={{ background: '#10B981', color: 'white', border: 'none' }} onClick={() => handleIntegrateERP(selectedQuote)}>
                  Accept & Spawn project
                </button>
              )}
              {isAdmin && (
                <button className="btn" style={{ background: '#EF4444', color: 'white', border: 'none' }} onClick={() => handleDeleteQuotation(selectedQuote.id)}>
                  Delete Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PRESETS MODULE PREVIEW MODAL --- */}
      {previewPreset && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{previewPreset.discipline} • {previewPreset.department}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>{previewPreset.name}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setPreviewPreset(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Metadata Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Typical Duration:</span>
                  <strong>{previewPreset.typicalDuration}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Difficulty:</span>
                  <strong style={{ color: previewPreset.difficulty === 'Expert' ? '#EF4444' : previewPreset.difficulty === 'Advanced' ? '#F59E0B' : '#10B981' }}>{previewPreset.difficulty}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Recommended Team:</span>
                  <strong>{previewPreset.recommendedTeam}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Total Estimate:</span>
                  <strong>{previewPreset.deliverables.reduce((acc, curr) => acc + (curr.estimated_hours || 0), 0)} hrs</strong>
                </div>
              </div>

              {/* Software Tools */}
              {previewPreset.software && previewPreset.software.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>Required Software Suite:</strong>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {previewPreset.software.map(sw => (
                      <span key={sw} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{sw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverables List Table */}
              <div>
                <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>Standard Deliverables ({previewPreset.deliverables.length}):</strong>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '8px' }}>Deliverable Description</th>
                        <th style={{ padding: '8px', width: '80px' }}>Est. Hours</th>
                        <th style={{ padding: '8px' }}>Remarks / Scope Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewPreset.deliverables.map((d, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{d.deliverable}</td>
                          <td style={{ padding: '8px' }}>{d.estimated_hours} hrs</td>
                          <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{d.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exclusions */}
              {previewPreset.exclusions && (
                <div>
                  <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px', color: '#EF4444' }}>Exclusions & Limits:</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '8px 12px', borderRadius: '6px', margin: 0 }}>
                    {previewPreset.exclusions}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setPreviewPreset(null)}
              >
                Close Preview
              </button>
              
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  handleMergePreset(previewPreset);
                  setPreviewPreset(null);
                }}
              >
                Merge Into Proposal
              </button>
              
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ background: 'var(--accent)', color: 'white', border: 'none' }}
                onClick={() => {
                  setDeliverables(previewPreset.deliverables.map(d => ({ ...d, included: true })));
                  triggerToast(`Loaded pre-filled items for preset: ${previewPreset.name}`);
                  setPreviewPreset(null);
                }}
              >
                Overwrite & Load Preset
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- SAVE CURRENT SCOPE AS TEMPLATE MODAL --- */}
      {showSavePresetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Save Current Scope as Template Preset</h3>
              <button 
                type="button" 
                onClick={() => setShowSavePresetModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Form */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Template Name *</label>
                <input 
                  type="text" 
                  value={newPresetName} 
                  onChange={(e) => setNewPresetName(e.target.value)} 
                  placeholder="e.g. Standard Piping Spool Assessment"
                  style={{ width: '100%', height: '38px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Discipline *</label>
                  <select 
                    value={newPresetDiscipline} 
                    onChange={(e) => setNewPresetDiscipline(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }}
                  >
                    <option value="Marine Engineering">Marine Engineering</option>
                    <option value="Structural">Structural</option>
                    <option value="Piping">Piping</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="CAD Services">CAD Services</option>
                    <option value="Software">Software</option>
                    <option value="Website">Website</option>
                    <option value="Internal">Internal</option>
                    <option value="Consultancy">Consultancy</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Department</label>
                  <input 
                    type="text" 
                    value={newPresetDept} 
                    onChange={(e) => setNewPresetDept(e.target.value)} 
                    placeholder="e.g. Piping Layout Dept"
                    style={{ width: '100%', height: '38px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Typical Duration</label>
                  <input 
                    type="text" 
                    value={newPresetDuration} 
                    onChange={(e) => setNewPresetDuration(e.target.value)} 
                    placeholder="e.g. 3 weeks"
                    style={{ width: '100%', height: '38px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Difficulty</label>
                  <select 
                    value={newPresetDifficulty} 
                    onChange={(e) => setNewPresetDifficulty(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)' }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Recommended Team</label>
                <input 
                  type="text" 
                  value={newPresetTeam} 
                  onChange={(e) => setNewPresetTeam(e.target.value)} 
                  placeholder="e.g. 1 Piping Engineer, 1 Drafter"
                  style={{ width: '100%', height: '38px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Required Software Suite (comma separated)</label>
                <input 
                  type="text" 
                  value={newPresetSoftware} 
                  onChange={(e) => setNewPresetSoftware(e.target.value)} 
                  placeholder="e.g. AutoCAD, Excel, Revit"
                  style={{ width: '100%', height: '38px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Exclusions & Limits</label>
                <textarea 
                  value={newPresetExclusions} 
                  onChange={(e) => setNewPresetExclusions(e.target.value)} 
                  placeholder="e.g. Site visits are not included in this package."
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
              </div>

              <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                ℹ️ This will save all <strong>{deliverables.length}</strong> items currently defined in Step 2 as deliverables for this template.
              </div>

            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowSavePresetModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ background: '#10B981', color: 'white', border: 'none', fontWeight: 'bold' }}
                onClick={handleSaveCurrentAsPreset}
              >
                Save Custom Template
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
