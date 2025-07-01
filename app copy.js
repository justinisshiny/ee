const { useState, useEffect, useRef, useCallback, useMemo } = React;
const { createRoot } = ReactDOM;

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibGFuZHN1cnZleW9ycyIsImEiOiJjbDU4cWpvYTgyNjNqM2NuenJmcGFycTZ0In0.69FMq1KPuwZs0Btd7-sSnw";

// Initialize websim socket for persistent data
const room = new WebsimSocket();

const App = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [zoneVisibility, setZoneVisibility] = useState(true);
  const [contaminationVisibility, setContaminationVisibility] = useState(true);
  const [infrastructureVisibility, setInfrastructureVisibility] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearsToDevelop, setYearsToDevelop] = useState(3);
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [buildPreference, setBuildPreference] = useState('balanced');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showAIProcessing, setShowAIProcessing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // New state for remediation parameters
  const [remediationMethod, setRemediationMethod] = useState('bioremediation');
  const [urgencyLevel, setUrgencyLevel] = useState(50);
  const [environmentalCompliance, setEnvironmentalCompliance] = useState('standard');
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [selectedFunding, setSelectedFunding] = useState(null);
  const [showAllFundingModal, setShowAllFundingModal] = useState(false);
  
  // New state for map style
  const [currentMapStyle, setCurrentMapStyle] = useState('mapbox://styles/landsurveyors/clzdj9zsm009k01qpghvy1s26');

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Sample data - in real app this would come from API/database
  const parcels = useMemo(() => [
    {
      id: 1,
      name: "Former Auto Plant",
      coordinates: [-111.927, 41.184],
      value: 750000,
      zoning: "M-1 (Manufacturing)",
      contamination: "Heavy Metals, Petroleum",
      level: "High",
      size: 12.5,
      apn: "W-0845-0012",
      address: "1245 Industrial Parkway, Hayesville, UT"
    },
    {
      id: 2,
      name: "Old Gas Station",
      coordinates: [-111.932, 41.187],
      value: 320000,
      zoning: "C-2 (Commercial)",
      contamination: "Petroleum, BTEX",
      level: "Medium",
      size: 0.75,
      apn: "W-0846-0105",
      address: "890 Main Street, Hayesville, UT"
    },
    {
      id: 3,
      name: "Former Dry Cleaner",
      coordinates: [-111.925, 41.181],
      value: 450000,
      zoning: "MU (Mixed Use)",
      contamination: "Chlorinated Solvents",
      level: "Medium-High",
      size: 1.2,
      apn: "W-0843-0237",
      address: "350 Commerce Way, Hayesville, UT"
    },
    {
      id: 4,
      name: "Abandoned Warehouse",
      coordinates: [-111.935, 41.179],
      value: 680000,
      zoning: "RM-10 (Residential Multi-Family)",
      contamination: "Asbestos, Lead",
      level: "Low",
      size: 3.8,
      apn: "W-0840-0349",
      address: "750 Cedar Avenue, Hayesville, UT"
    },
    {
      id: 5,
      name: "Former Textile Factory",
      coordinates: [-111.929, 41.190],
      value: 920000,
      zoning: "M-1 (Manufacturing)",
      contamination: "VOCs, Dyes",
      level: "Medium",
      size: 7.2,
      apn: "W-0835-0128",
      address: "2100 Manufacturing Lane, Hayesville, UT"
    },
    {
      id: 6,
      name: "Closed Landfill Site",
      coordinates: [-111.940, 41.183],
      value: 580000,
      zoning: "OS (Open Space)",
      contamination: "Methane, Heavy Metals",
      level: "High",
      size: 15.8,
      apn: "W-0841-0456",
      address: "3200 Waste Management Road, Hayesville, UT"
    },
    {
      id: 7,
      name: "Former Chemical Plant",
      coordinates: [-111.923, 41.188],
      value: 1250000,
      zoning: "M-2 (Heavy Manufacturing)",
      contamination: "PCB, Chlorinated Compounds",
      level: "High",
      size: 22.4,
      apn: "W-0847-0789",
      address: "4580 Chemical Way, Hayesville, UT"
    },
    {
      id: 8,
      name: "Old Railroad Yard",
      coordinates: [-111.938, 41.176],
      value: 395000,
      zoning: "M-1 (Manufacturing)",
      contamination: "Diesel, Creosote",
      level: "Medium-High",
      size: 8.9,
      apn: "W-0838-0234",
      address: "1850 Railroad Street, Hayesville, UT"
    },
    {
      id: 9,
      name: "Former Paint Factory",
      coordinates: [-111.930, 41.192],
      value: 425000,
      zoning: "C-1 (Commercial)",
      contamination: "Lead Paint, Solvents",
      level: "Medium",
      size: 2.1,
      apn: "W-0833-0567",
      address: "720 Paint Works Avenue, Hayesville, UT"
    },
    {
      id: 10,
      name: "Abandoned Steel Mill",
      coordinates: [-111.942, 41.181],
      value: 1800000,
      zoning: "M-2 (Heavy Manufacturing)",
      contamination: "Heavy Metals, Oil",
      level: "High",
      size: 45.6,
      apn: "W-0839-0890",
      address: "5000 Steel Mill Drive, Hayesville, UT"
    }
  ], []);

  // Map styles configuration
  const mapStyles = [
    {
      name: 'Dark',
      style: 'mapbox://styles/landsurveyors/clzdj9zsm009k01qpghvy1s26'
    },
    {
      name: 'Cartogram',
      style: 'mapbox://styles/landsurveyors/cj4izrn2i03ty2rlaizw7knup'
    },
    {
      name: 'Civic',
      style: 'mapbox://styles/landsurveyors/cjaa29acq21o32rpazc7l8g5o'
    },
    {
      name: 'Satellite',
      style: 'mapbox://styles/mapbox/satellite-v9'
    },
    {
      name: 'Terrain',
      style: 'mapbox://styles/mapbox/outdoors-v12'
    }
  ];

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
      
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: currentMapStyle,
        projection: 'globe', // Start with globe projection
        center: [0, 0], // Start at world center
        zoom: 1 // Low zoom for globe view
      });

      mapRef.current.on('style.load', () => {
        mapRef.current.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        // add the DEM source as a terrain layer with exaggerated height
        mapRef.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
      });

      mapRef.current.on('load', () => {
        // Add sky layer for atmosphere effect
        mapRef.current.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        // Fly to Hayesville, UT after a brief delay
        setTimeout(() => {
          mapRef.current.flyTo({
            center: [-111.93, 41.185],
            zoom: 14,
            bearing: 0,
            pitch: 45,
            duration: 3000,
            essential: true
          });
          
          // Switch to mercator projection after fly animation
          setTimeout(() => {
            mapRef.current.setProjection('mercator');
          }, 3000);
        }, 1000);

        // Add parcel markers after fly animation completes
        setTimeout(() => {
          parcels.forEach(parcel => {
            const marker = document.createElement('div');
            marker.className = 'w-5 h-5 rounded-full';
            marker.style.backgroundColor = getContaminationColor(parcel.level);
            marker.style.border = '2px solid white';
            marker.style.cursor = 'pointer';
            
            new mapboxgl.Marker(marker)
              .setLngLat(parcel.coordinates)
              .setPopup(new mapboxgl.Popup().setHTML(
                `<div class="p-2 bg-gray-800 text-white rounded">
                  <h3 class="font-bold">${parcel.name}</h3>
                  <p>Zoning: ${parcel.zoning}</p>
                  <p>Contamination: ${parcel.contamination}</p>
                  <button class="mt-2 px-3 py-1 bg-teal-600 rounded hover:bg-teal-700 text-xs" onclick="document.dispatchEvent(new CustomEvent('selectParcel', {detail: ${parcel.id}}))">
                    Select
                  </button>
                </div>`
              ))
              .addTo(mapRef.current);
          });
        }, 4000);

        // Setup event listener for parcel selection from popup
        document.addEventListener('selectParcel', (e) => {
          const selectedId = e.detail;
          const parcel = parcels.find(p => p.id === selectedId);
          if (parcel) {
            setSelectedParcel(parcel);
            setActiveTab('analyzer');
            generateAISuggestions(parcel);
          }
        });
      });
    }
  }, [parcels]);

  const getContaminationColor = (level) => {
    switch(level) {
      case 'High': return '#ef4444';
      case 'Medium-High': return '#f97316';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchedParcel = parcels.find(
      p => p.apn.toLowerCase().includes(searchQuery.toLowerCase()) || 
           p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (searchedParcel) {
      setSelectedParcel(searchedParcel);
      mapRef.current.flyTo({
        center: searchedParcel.coordinates,
        zoom: 16,
        speed: 1.2
      });
      setActiveTab('analyzer');
      generateAISuggestions(searchedParcel);
    } else {
      alert('No matching parcels found. Try a different APN or address.');
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setIsLoading(true);
    try {
      // In a real app, this would upload to server and process
      const fileUrl = await websim.upload(file);
      
      // Simulate AI processing of the environmental report
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(`Environmental report uploaded: ${file.name}\nProcessing complete!`);
      setShowUploadModal(false);
      
      // For demo, just update the UI as if we found something
      if (selectedParcel) {
        setSelectedParcel({
          ...selectedParcel,
          contaminationDetails: "Report analysis detected: Petroleum hydrocarbons at 320 ppm, Lead at 150 ppm, both above regulatory thresholds. Groundwater appears unaffected based on monitoring well data."
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISuggestions = async (parcel) => {
    if (!parcel) return;
    
    setShowAIProcessing(true);
    
    try {
      // In a real app, we'd make a proper API call to our backend
      // which would interface with GPT-4 using parcel data
      const completion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert in brownfield redevelopment, real estate valuation, and Utah zoning laws. 
            Provide realistic development recommendations for brownfield sites based on their characteristics.
            Respond directly with JSON, following this JSON schema, and no other text:
            {
              bestUse: string,
              alternativeUses: string[],
              remediationCost: { min: number, max: number },
              remediationTimeMonths: number,
              postRemediationValue: number,
              roi: number,
              confidence: number,
              recommendations: string[],
              fundingOpportunities: { name: string, value: string, criteria: string, website?: string }[]
            }`
          },
          {
            role: "user",
            content: `Analyze this brownfield site and provide redevelopment recommendations:
            Name: ${parcel.name}
            Location: Hayesville, UT (south of Ogden)
            Current Value: $${parcel.value.toLocaleString()}
            Size: ${parcel.size} acres
            Zoning: ${parcel.zoning}
            Contamination: ${parcel.contamination}
            Contamination Level: ${parcel.level}
            Years to Develop: ${yearsToDevelop}
            Risk Tolerance: ${riskTolerance}%
            Build Preference: ${buildPreference}`
          }
        ],
        json: true
      });
      
      const suggestions = JSON.parse(completion.content);
      setAiSuggestions(suggestions);
      
      // After receiving AI suggestions, generate a visualization image
      generateSiteVisualization(parcel, suggestions.bestUse);
      
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      setAiSuggestions({
        bestUse: "Mixed-use development (retail/residential)",
        alternativeUses: ["Multi-family housing", "Light commercial", "Community space"],
        remediationCost: { min: 250000, max: 380000 },
        remediationTimeMonths: 8,
        postRemediationValue: parcel.value * 2.3,
        roi: 145,
        confidence: 78,
        recommendations: [
          "Pursue petroleum hydrocarbon bioremediation with Natura Solve protocols",
          "Initiate Phase II Environmental Assessment for precise contamination mapping",
          "Check eligibility for EPA Brownfield Cleanup Grant"
        ],
        fundingOpportunities: [
          {
            name: "EPA Brownfield Cleanup Grant",
            value: "Up to $500,000",
            criteria: "Cleanup of sites contaminated with hazardous substances",
            website: "https://www.epa.gov/brownfields/types-brownfields-grant-funding"
          },
          {
            name: "Utah DEQ Brownfield Loan Fund",
            value: "Low-interest financing",
            criteria: "Redevelopment creating jobs in distressed areas",
            website: "https://deq.utah.gov/environmental-response-and-remediation/brownfields-program"
          }
        ]
      });
    } finally {
      setShowAIProcessing(false);
    }
  };

  const generateSiteVisualization = async (parcel, bestUse) => {
    try {
      const result = await websim.imageGen({
        prompt: `A realistic architectural rendering of a redeveloped brownfield site that used to be ${parcel.name} in Hayesville, Utah. 
        The new development is a ${bestUse} with modern sustainable design features. Include green spaces, accessible walkways, and energy-efficient buildings. 
        Show how the site integrates with the surrounding community. Photorealistic 3D rendering style, daytime, clear skies.`,
        aspect_ratio: "16:9"
      });
      
      // Store the visualization in the state
      setAiSuggestions(prev => ({
        ...prev,
        visualization: result.url
      }));
    } catch (error) {
      console.error("Error generating visualization:", error);
    }
  };

  const generateReport = async () => {
    if (!selectedParcel || !aiSuggestions) return;
    
    setIsLoading(true);
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Set up the PDF
      doc.setFontSize(20);
      doc.text('Brownfield Development Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated by Natura Solve - ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Site Information
      doc.setFontSize(16);
      doc.text('Site Information', 20, 50);
      doc.setFontSize(11);
      
      let yPosition = 60;
      const siteInfo = [
        `Site Name: ${selectedParcel.name}`,
        `Address: ${selectedParcel.address}`,
        `APN: ${selectedParcel.apn}`,
        `Parcel Size: ${selectedParcel.size} acres`,
        `Current Value: $${selectedParcel.value.toLocaleString()}`,
        `Zoning: ${selectedParcel.zoning}`,
        `Contamination: ${selectedParcel.contamination}`,
        `Contamination Level: ${selectedParcel.level}`
      ];
      
      siteInfo.forEach(info => {
        doc.text(info, 20, yPosition);
        yPosition += 8;
      });
      
      // Development Analysis
      yPosition += 10;
      doc.setFontSize(16);
      doc.text('Development Analysis', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(11);
      
      const analysisInfo = [
        `Recommended Best Use: ${aiSuggestions.bestUse}`,
        `Alternative Uses: ${aiSuggestions.alternativeUses.join(', ')}`,
        `Estimated Remediation Cost: $${aiSuggestions.remediationCost.min.toLocaleString()} - $${aiSuggestions.remediationCost.max.toLocaleString()}`,
        `Remediation Timeline: ${aiSuggestions.remediationTimeMonths} months`,
        `Post-Remediation Value: $${aiSuggestions.postRemediationValue.toLocaleString()}`,
        `Estimated ROI: ${aiSuggestions.roi}%`,
        `Confidence Score: ${aiSuggestions.confidence}%`
      ];
      
      analysisInfo.forEach(info => {
        doc.text(info, 20, yPosition);
        yPosition += 8;
      });
      
      // Development Timeline
      yPosition += 10;
      doc.setFontSize(16);
      doc.text('Development Timeline', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(11);
      
      const timelineSteps = [
        { phase: 'Acquisition', timeframe: 'Month 1', cost: `$${selectedParcel.value.toLocaleString()}` },
        { phase: 'Remediation', timeframe: `Months 2-${aiSuggestions.remediationTimeMonths + 1}`, cost: `$${aiSuggestions.remediationCost.min.toLocaleString()} - $${aiSuggestions.remediationCost.max.toLocaleString()}` },
        { phase: 'Permitting', timeframe: `Months ${aiSuggestions.remediationTimeMonths + 1}-${aiSuggestions.remediationTimeMonths + 3}`, cost: '$75,000 - $120,000' },
        { phase: 'Construction', timeframe: `Months ${aiSuggestions.remediationTimeMonths + 3}-${aiSuggestions.remediationTimeMonths + 15}`, cost: 'Varies by build type' },
        { phase: 'Completion', timeframe: `Month ${aiSuggestions.remediationTimeMonths + 15}`, cost: `$${aiSuggestions.postRemediationValue.toLocaleString()}` }
      ];
      
      timelineSteps.forEach(step => {
        doc.text(`${step.phase}: ${step.timeframe} - ${step.cost}`, 20, yPosition);
        yPosition += 8;
      });
      
      // Add new page for recommendations and funding
      doc.addPage();
      yPosition = 20;
      
      // Key Recommendations
      doc.setFontSize(16);
      doc.text('Key Recommendations', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(11);
      
      aiSuggestions.recommendations.forEach((rec, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 170);
        lines.forEach(line => {
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 2;
      });
      
      // Funding Opportunities
      yPosition += 10;
      doc.setFontSize(16);
      doc.text('Funding Opportunities', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(11);
      
      aiSuggestions.fundingOpportunities.forEach((funding, index) => {
        doc.text(`${index + 1}. ${funding.name}`, 20, yPosition);
        yPosition += 6;
        doc.text(`   Value: ${funding.value}`, 20, yPosition);
        yPosition += 6;
        const criteriaLines = doc.splitTextToSize(`   Criteria: ${funding.criteria}`, 170);
        criteriaLines.forEach(line => {
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 4;
      });
      
      // Remediation Parameters
      yPosition += 10;
      doc.setFontSize(16);
      doc.text('Remediation Parameters', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(11);
      
      const remediationParams = [
        `Selected Method: ${remediationMethod.charAt(0).toUpperCase() + remediationMethod.slice(1)}`,
        `Urgency Level: ${urgencyLevel}%`,
        `Environmental Compliance: ${environmentalCompliance.charAt(0).toUpperCase() + environmentalCompliance.slice(1)}`,
        `Development Timeline: ${yearsToDevelop} years`,
        `Risk Tolerance: ${riskTolerance}%`,
        `Build Preference: ${buildPreference.charAt(0).toUpperCase() + buildPreference.slice(1)}`
      ];
      
      remediationParams.forEach(param => {
        doc.text(param, 20, yPosition);
        yPosition += 8;
      });
      
      // Value Analysis Summary
      yPosition += 10;
      doc.setFontSize(16);
      doc.text('Value Analysis Summary', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(11);
      
      const valueIncrease = Math.round((aiSuggestions.postRemediationValue / selectedParcel.value - 1) * 100);
      const netProfit = aiSuggestions.postRemediationValue - selectedParcel.value - aiSuggestions.remediationCost.max;
      
      const valueSummary = [
        `Current Market Value: $${selectedParcel.value.toLocaleString()}`,
        `Projected Post-Remediation Value: $${aiSuggestions.postRemediationValue.toLocaleString()}`,
        `Value Increase: +${valueIncrease}%`,
        `Maximum Remediation Cost: $${aiSuggestions.remediationCost.max.toLocaleString()}`,
        `Estimated Net Profit: $${netProfit.toLocaleString()}`,
        `Return on Investment: ${aiSuggestions.roi}%`
      ];
      
      valueSummary.forEach(summary => {
        doc.text(summary, 20, yPosition);
        yPosition += 8;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.text('This report is generated by Natura Solve AI analysis and should be verified with professional consultants.', 20, 280);
      doc.text('For more information, visit: naturaSolve.com', 20, 285);
      
      // Save the PDF
      doc.save(`Brownfield_Report_${selectedParcel.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Show success message
      alert("PDF report generated successfully and downloaded!");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOnMap = () => {
    if (selectedParcel && mapRef.current) {
      setActiveTab('map');
      setMobileMenuOpen(false);
      mapRef.current.flyTo({
        center: selectedParcel.coordinates,
        zoom: 16,
        speed: 1.2
      });
    }
  };

  const handleUploadReports = () => {
    setShowUploadModal(true);
  };

  const openFundingModal = (funding) => {
    setSelectedFunding(funding);
    setShowFundingModal(true);
  };

  // Funding Modal Component
  const FundingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{selectedFunding?.name}</h3>
          <button 
            onClick={() => setShowFundingModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Funding Amount</h4>
            <p className="text-2xl font-bold text-teal-400">{selectedFunding?.value}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Eligibility Criteria</h4>
            <p className="text-gray-300">{selectedFunding?.criteria}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Application Process</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center mr-3 text-sm">1</div>
                <span>Submit initial application with site documentation</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center mr-3 text-sm">2</div>
                <span>Environmental assessment review (2-4 weeks)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center mr-3 text-sm">3</div>
                <span>Final approval and funding distribution</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Required Documentation</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Phase I Environmental Site Assessment</li>
              <li>Site remediation plan</li>
              <li>Development timeline and budget</li>
              <li>Community impact statement</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
            <button 
              onClick={() => setShowFundingModal(false)}
              className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition"
            >
              Close
            </button>
            {selectedFunding?.website && (
              <a 
                href={selectedFunding.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 text-teal-400 rounded-md hover:bg-gray-600 transition"
              >
                Visit Official Site
              </a>
            )}
            <button className="px-4 py-2 bg-teal-600 rounded-md hover:bg-teal-700 transition">
              Start Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // All Funding Modal Component
  const AllFundingModal = () => {
    const allFundingOptions = [
      {
        name: "EPA Brownfield Cleanup Grant",
        value: "Up to $500,000",
        criteria: "Cleanup of sites contaminated with hazardous substances",
        type: "Federal Grant",
        deadline: "December 31, 2024",
        website: "https://www.epa.gov/brownfields/types-brownfields-grant-funding"
      },
      {
        name: "Utah DEQ Brownfield Loan Fund",
        value: "Low-interest financing",
        criteria: "Redevelopment creating jobs in distressed areas",
        type: "State Loan",
        deadline: "Rolling basis",
        website: "https://deq.utah.gov/environmental-response-and-remediation/brownfields-program"
      },
      {
        name: "Weber County Development Incentive",
        value: "Tax abatement up to 50%",
        criteria: "Mixed-use developments over 2 acres",
        type: "Local Incentive",
        deadline: "Quarterly applications",
        website: "https://www.webercountyutah.gov/economic-development/"
      },
      {
        name: "Opportunity Zone Investment Credit",
        value: "Capital gains deferral",
        criteria: "Investment in designated opportunity zones",
        type: "Federal Tax Credit",
        deadline: "December 2026",
        website: "https://www.irs.gov/credits-deductions/businesses/opportunity-zones"
      },
      {
        name: "Housing Trust Fund",
        value: "Up to $2,000,000",
        criteria: "Affordable housing development (30% affordable units)",
        type: "State Grant",
        deadline: "March 15, 2025",
        website: "https://housing.utah.gov/programs/housing-trust-fund"
      }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">All Funding Opportunities</h3>
            <button 
              onClick={() => setShowAllFundingModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allFundingOptions.map((funding, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{funding.name}</h4>
                  <span className="bg-teal-900 text-teal-300 text-xs px-2 py-1 rounded">{funding.type}</span>
                </div>
                <p className="text-teal-400 font-medium mb-2">{funding.value}</p>
                <p className="text-sm text-gray-300 mb-3">{funding.criteria}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Deadline: {funding.deadline}</span>
                  <div className="flex space-x-2">
                    {funding.website && (
                      <a 
                        href={funding.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Official Site ↗
                      </a>
                    )}
                    <button 
                      className="text-teal-400 hover:text-teal-300"
                      onClick={() => {
                        setSelectedFunding(funding);
                        setShowAllFundingModal(false);
                        setShowFundingModal(true);
                      }}
                    >
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-800 mt-6">
            <button 
              onClick={() => setShowAllFundingModal(false)}
              className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const calculateAdjustedRemediation = useCallback((baseSuggestions) => {
    if (!baseSuggestions) return baseSuggestions;

    const methodMultipliers = {
      'bioremediation': 1.0,
      'chemical': 1.3,
      'thermal': 1.8,
      'excavation': 2.2
    };

    const urgencyMultiplier = 1 + (urgencyLevel - 50) / 100;
    const complianceMultipliers = {
      'basic': 0.8,
      'standard': 1.0,
      'enhanced': 1.4
    };

    const baseMultiplier = methodMultipliers[remediationMethod] * urgencyMultiplier * complianceMultipliers[environmentalCompliance];

    return {
      ...baseSuggestions,
      remediationCost: {
        min: Math.round(baseSuggestions.remediationCost.min * baseMultiplier),
        max: Math.round(baseSuggestions.remediationCost.max * baseMultiplier)
      },
      remediationTimeMonths: Math.round(baseSuggestions.remediationTimeMonths * (remediationMethod === 'bioremediation' ? 1.2 : remediationMethod === 'excavation' ? 0.6 : 1.0) * (urgencyLevel > 70 ? 0.8 : urgencyLevel < 30 ? 1.3 : 1.0)),
      postRemediationValue: Math.round(baseSuggestions.postRemediationValue * (1 + (environmentalCompliance === 'enhanced' ? 0.15 : 0))),
      roi: Math.round(baseSuggestions.roi * (baseMultiplier < 1.2 ? 1.1 : baseMultiplier > 1.8 ? 0.9 : 1.0))
    };
  }, [remediationMethod, urgencyLevel, environmentalCompliance]);

  // Update AI suggestions when remediation parameters change
  useEffect(() => {
    if (aiSuggestions && !showAIProcessing) {
      const originalSuggestions = { ...aiSuggestions };
      setAiSuggestions(calculateAdjustedRemediation(originalSuggestions));
    }
  }, [remediationMethod, urgencyLevel, environmentalCompliance, calculateAdjustedRemediation]);

  // Handle map style changes
  const handleMapStyleChange = (newStyle) => {
    if (mapRef.current && newStyle !== currentMapStyle) {
      setCurrentMapStyle(newStyle);
      mapRef.current.setStyle(newStyle);
      
      // Re-add terrain and sky after style change
      mapRef.current.once('styledata', () => {
        mapRef.current.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        
        mapRef.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        
        mapRef.current.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        // Re-add parcel markers
        parcels.forEach(parcel => {
          const marker = document.createElement('div');
          marker.className = 'w-5 h-5 rounded-full';
          marker.style.backgroundColor = getContaminationColor(parcel.level);
          marker.style.border = '2px solid white';
          marker.style.cursor = 'pointer';
          
          new mapboxgl.Marker(marker)
            .setLngLat(parcel.coordinates)
            .setPopup(new mapboxgl.Popup().setHTML(
              `<div class="p-2 bg-gray-800 text-white rounded">
                <h3 class="font-bold">${parcel.name}</h3>
                <p>Zoning: ${parcel.zoning}</p>
                <p>Contamination: ${parcel.contamination}</p>
                <button class="mt-2 px-3 py-1 bg-teal-600 rounded hover:bg-teal-700 text-xs" onclick="document.dispatchEvent(new CustomEvent('selectParcel', {detail: ${parcel.id}}))">
                  Select
                </button>
              </div>`
            ))
            .addTo(mapRef.current);
        });
      });
    }
  };

  // UI Components
  const Navigation = () => (
    <nav className="bg-gray-900 px-4 md:px-6 py-4 border-b border-gray-800 sticky top-0 z-50">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Natura Solve Logo" className="h-8 w-auto" />
            <div>
              <h1 className="text-xl font-bold">Brownfield Value Unlocker</h1>
              <span className="text-xs text-teal-400">Powered by Natura Solve</span>
            </div>
          </div>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
        
        <div className={`mt-4 md:mt-0 ${mobileMenuOpen ? 'block' : 'hidden md:flex'} md:space-x-4`}>
          <button 
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-md transition flex items-center ${activeTab === 'map' ? 'bg-gray-800 text-teal-400' : 'hover:bg-gray-800'}`}
          >
            <img src="/development_icon.png" alt="Map" className="w-5 h-5 mr-2" />
            Map View
          </button>
          <button 
            onClick={() => setActiveTab('analyzer')}
            className={`px-4 py-2 rounded-md transition flex items-center ${activeTab === 'analyzer' ? 'bg-gray-800 text-teal-400' : 'hover:bg-gray-800'}`}
          >
            <img src="/analysis_icon.png" alt="Analyzer" className="w-5 h-5 mr-2" />
            Analyzer
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-md transition flex items-center ${activeTab === 'reports' ? 'bg-gray-800 text-teal-400' : 'hover:bg-gray-800'}`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Reports
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md transition flex items-center ${activeTab === 'settings' ? 'bg-gray-800 text-teal-400' : 'hover:bg-gray-800'}`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Settings
          </button>
        </div>
        
        <div className={`mt-4 md:mt-0 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search by APN or address..."
              className="px-3 py-2 bg-gray-800 rounded-l-md border-r-0 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-teal-600 rounded-r-md hover:bg-teal-700 transition text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Search
            </button>
          </form>
        </div>
      </div>
    </nav>
  );

  const MapView = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 h-[calc(100vh-80px)]">
        <div className="col-span-1 md:col-span-3 bg-gray-900 rounded-2xl overflow-hidden shadow-xl order-2 md:order-1 relative">
          {/* Map Style Switcher */}
          <div className="absolute top-4 left-4 z-10 bg-gray-900 rounded-lg shadow-xl">
            <div className="p-3">
              <label className="text-sm font-medium text-gray-300 block mb-2">Map Style</label>
              <select 
                value={currentMapStyle}
                onChange={(e) => handleMapStyleChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {mapStyles.map((style) => (
                  <option key={style.style} value={style.style}>
                    {style.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div ref={mapContainerRef} className="map-container" />
        </div>
        
        {/* Mobile toggle button */}
        <button 
          className="fixed bottom-4 right-4 z-10 md:hidden bg-gray-800 p-3 rounded-full shadow-lg"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sidebarCollapsed ? "M4 6h16M4 12h16m-7 6h7" : "M6 18L18 6M6 6l12 12"}></path>
          </svg>
        </button>
        
        <div className={`space-y-4 order-1 md:order-2 ${sidebarCollapsed ? 'hidden' : 'block'} md:block`}>
          <div className="bg-gray-900 p-4 rounded-2xl shadow-xl">
            <h2 className="font-bold text-lg mb-3 border-b border-gray-800 pb-2">Map Controls</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Zoning Overlay</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={zoneVisibility}
                    onChange={() => setZoneVisibility(!zoneVisibility)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Contamination</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={contaminationVisibility}
                    onChange={() => setContaminationVisibility(!contaminationVisibility)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Infrastructure</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={infrastructureVisibility}
                    onChange={() => setInfrastructureVisibility(!infrastructureVisibility)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span>3D Terrain</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    defaultChecked
                    onChange={(e) => {
                      if (mapRef.current) {
                        if (e.target.checked) {
                          mapRef.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
                        } else {
                          mapRef.current.setTerrain(null);
                        }
                      }
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-800">
              <h3 className="font-medium mb-2">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                  <span>High Contamination</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                  <span>Medium-High Contamination</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                  <span>Medium Contamination</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                  <span>Low Contamination</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-2xl shadow-xl">
            <h2 className="font-bold text-lg mb-3 border-b border-gray-800 pb-2">Brownfield Site Overview</h2>
            <p className="text-sm">
              The Hayesville area contains multiple brownfield sites with varying levels of contamination.
              Select a site on the map for detailed analysis or use the search function to find specific parcels.
            </p>
            <p className="mt-3 text-sm text-teal-400">
              10 brownfield sites currently identified in this area.
            </p>
            
            <button 
              onClick={() => setShowUploadModal(true)}
              className="mt-4 w-full py-2 bg-teal-600 rounded-md hover:bg-teal-700 transition text-sm"
            >
              Upload Environmental Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AnalyzerView = () => (
    <div className="p-4">
      {!selectedParcel ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
              <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No Parcel Selected</h2>
            <p className="text-gray-400 mb-6">Select a parcel from the map or search by APN/address to view detailed analysis and AI-powered recommendations.</p>
            <button 
              onClick={() => {
                setActiveTab('map');
                setMobileMenuOpen(false);
              }}
              className="px-4 py-2 bg-teal-600 rounded-md hover:bg-teal-700 transition"
            >
              Go to Map View
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left column - Parcel info */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-teal-400">{selectedParcel.name}</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2">
                  <span className="text-gray-400">Location:</span>
                  <span>{selectedParcel.address}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-gray-400">APN:</span>
                  <span>{selectedParcel.apn}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-gray-400">Parcel Size:</span>
                  <span>{selectedParcel.size} acres</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-gray-400">Current Value:</span>
                  <span>${selectedParcel.value.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-gray-400">Zoning:</span>
                  <span>{selectedParcel.zoning}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-gray-400">Contamination:</span>
                  <span>{selectedParcel.contamination}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-gray-400">Level:</span>
                  <span>
                    <span 
                      className={`inline-block w-3 h-3 rounded-full mr-2`}
                      style={{backgroundColor: getContaminationColor(selectedParcel.level)}}
                    ></span>
                    {selectedParcel.level}
                  </span>
                </div>
              </div>
              
              {selectedParcel.contaminationDetails && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg text-sm">
                  <h3 className="font-semibold mb-1">Environmental Report Analysis:</h3>
                  <p className="text-gray-300">{selectedParcel.contaminationDetails}</p>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between">
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-gray-800 text-teal-400 rounded-md hover:bg-gray-700 transition text-sm"
                >
                  Upload Reports
                </button>
                <button 
                  className="px-4 py-2 bg-gray-800 text-teal-400 rounded-md hover:bg-gray-700 transition text-sm"
                  onClick={() => {
                    setActiveTab('map');
                    setMobileMenuOpen(false);
                    handleViewOnMap();
                  }}
                >
                  View on Map
                </button>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold mb-4">Development Parameters</h2>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium">Years to Develop</label>
                    <span className="text-sm text-teal-400">{yearsToDevelop} years</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={yearsToDevelop} 
                    onChange={(e) => setYearsToDevelop(Number(e.target.value))}
                    className="custom-slider"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium">Risk Tolerance</label>
                    <span className="text-sm text-teal-400">{riskTolerance}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={riskTolerance} 
                    onChange={(e) => setRiskTolerance(Number(e.target.value))}
                    className="custom-slider"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Build Type Preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      className={`py-2 rounded-md text-sm ${buildPreference === 'commercial' ? 'bg-teal-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                      onClick={() => setBuildPreference('commercial')}
                    >
                      Commercial
                    </button>
                    <button 
                      className={`py-2 rounded-md text-sm ${buildPreference === 'residential' ? 'bg-teal-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                      onClick={() => setBuildPreference('residential')}
                    >
                      Residential
                    </button>
                    <button 
                      className={`py-2 rounded-md text-sm ${buildPreference === 'balanced' ? 'bg-teal-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                      onClick={() => setBuildPreference('balanced')}
                    >
                      Balanced
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Environmental Compliance</label>
                  <select 
                    value={environmentalCompliance}
                    onChange={(e) => setEnvironmentalCompliance(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="basic">Basic Compliance</option>
                    <option value="standard">Standard Compliance</option>
                    <option value="enhanced">Enhanced Compliance</option>
                  </select>
                  
                  <button 
                    onClick={() => generateAISuggestions(selectedParcel)}
                    className="w-full mt-3 py-2 bg-gray-700 text-teal-400 rounded-md hover:bg-gray-600 transition text-sm"
                    disabled={showAIProcessing}
                  >
                    {showAIProcessing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Recalculating...
                      </span>
                    ) : "Recalculate Timeline & Cost"}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold mb-4">Remediation Timeline & Cost</h2>
              {/* Remediation Parameters */}
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm font-medium mb-4">Remediation Parameters</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Remediation Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        className={`py-2 px-3 rounded-md text-xs ${remediationMethod === 'bioremediation' ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        onClick={() => setRemediationMethod('bioremediation')}
                      >
                        Bioremediation
                      </button>
                      <button 
                        className={`py-2 px-3 rounded-md text-xs ${remediationMethod === 'chemical' ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        onClick={() => setRemediationMethod('chemical')}
                      >
                        Chemical
                      </button>
                      <button 
                        className={`py-2 px-3 rounded-md text-xs ${remediationMethod === 'thermal' ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        onClick={() => setRemediationMethod('thermal')}
                      >
                        Thermal
                      </button>
                      <button 
                        className={`py-2 px-3 rounded-md text-xs ${remediationMethod === 'excavation' ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        onClick={() => setRemediationMethod('excavation')}
                      >
                        Excavation
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium">Urgency Level</label>
                      <span className="text-sm text-teal-400">{urgencyLevel}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={urgencyLevel} 
                      onChange={(e) => setUrgencyLevel(Number(e.target.value))}
                      className="custom-slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Standard</span>
                      <span>Rush</span>
                    </div>
                  </div>
                </div>
              </div>
              {showAIProcessing ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p>Analyzing remediation options...</p>
                  </div>
                </div>
              ) : aiSuggestions ? (
                <div>
                  <div className="flex justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-400">Estimated Timeline</p>
                      <p className="text-xl font-bold">{aiSuggestions.remediationTimeMonths} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Estimated Cost</p>
                      <p className="text-xl font-bold">${aiSuggestions.remediationCost.min.toLocaleString()} - ${aiSuggestions.remediationCost.max.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-teal-900 text-teal-300">
                          Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-teal-400">
                          0%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-800">
                      <div style={{width: "0%"}} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">1</div>
                      <div>
                        <p className="font-medium">Site Assessment</p>
                        <p className="text-sm text-gray-400">Comprehensive testing and evaluation</p>
                      </div>
                      <div className="ml-auto text-gray-400">Month 1</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">2</div>
                      <div>
                        <p className="font-medium">Remediation Planning</p>
                        <p className="text-sm text-gray-400">Engineering design and permitting</p>
                      </div>
                      <div className="ml-auto text-gray-400">Month 2-3</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">3</div>
                      <div>
                        <p className="font-medium">Active Remediation</p>
                        <p className="text-sm text-gray-400">Natura Solve bioremediation protocols</p>
                      </div>
                      <div className="ml-auto text-gray-400">Month 4-{3 + aiSuggestions.remediationTimeMonths}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">4</div>
                      <div>
                        <p className="font-medium">Final Testing & Certification</p>
                        <p className="text-sm text-gray-400">Regulatory approval process</p>
                      </div>
                      <div className="ml-auto text-gray-400">Month {4 + aiSuggestions.remediationTimeMonths}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400">Select a parcel to view remediation details</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <h2 className="text-lg font-bold">ROI Calculator</h2>
                </div>
              </div>
              
              {showAIProcessing ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p>Calculating ROI...</p>
                  </div>
                </div>
              ) : aiSuggestions && selectedParcel ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-xl p-4">
                      <p className="text-sm text-gray-400 mb-1">Total Investment</p>
                      <p className="text-xl font-bold">${(selectedParcel.value + aiSuggestions.remediationCost.max + 200000).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Acquisition + Remediation + Development</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4">
                      <p className="text-sm text-gray-400 mb-1">Projected Revenue</p>
                      <p className="text-xl font-bold">${aiSuggestions.postRemediationValue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Post-development market value</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Net Profit</p>
                      <p className="text-2xl font-bold text-teal-400">
                        ${(aiSuggestions.postRemediationValue - selectedParcel.value - aiSuggestions.remediationCost.max - 200000).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-teal-500 h-3 rounded-full" 
                        style={{width: `${Math.min(100, aiSuggestions.roi)}%`}}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Break-even</span>
                      <span>{aiSuggestions.roi}% ROI</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-400">{Math.round(aiSuggestions.remediationTimeMonths + 12)}</p>
                      <p className="text-xs text-gray-400">Months to ROI</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{Math.round(aiSuggestions.roi/12)}%</p>
                      <p className="text-xs text-gray-400">Monthly Return</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-400">{aiSuggestions.confidence}%</p>
                      <p className="text-xs text-gray-400">Confidence</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-800">
                    <h4 className="font-medium mb-3">Investment Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Land Acquisition:</span>
                        <span>${selectedParcel.value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Remediation:</span>
                        <span>${aiSuggestions.remediationCost.max.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Development:</span>
                        <span>$200,000</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-gray-700 pt-2">
                        <span>Total Investment:</span>
                        <span className="text-teal-400">${(selectedParcel.value + aiSuggestions.remediationCost.max + 200000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-400">Select a parcel and run analysis to calculate ROI</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold mb-4">Funding Opportunities</h2>
              
              {showAIProcessing ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p>Searching funding sources...</p>
                  </div>
                </div>
              ) : aiSuggestions?.fundingOpportunities ? (
                <div className="space-y-4">
                  {aiSuggestions.fundingOpportunities.map((funding, index) => (
                    <button 
                      key={index} 
                      className="w-full bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition text-left"
                      onClick={() => openFundingModal(funding)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-medium">{funding.name}</h3>
                        <span className="text-teal-400 font-medium">{funding.value}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{funding.criteria}</p>
                      {funding.website && (
                        <a 
                          href={funding.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Official Website ↗
                        </a>
                      )}
                    </button>
                  ))}
                  
                  <button 
                    className="w-full py-2 bg-gray-800 text-teal-400 rounded-md hover:bg-gray-700 transition mt-2 text-sm"
                    onClick={() => setShowAllFundingModal(true)}
                  >
                    View All Funding Options
                  </button>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-gray-400">Select a parcel to view funding opportunities</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Middle column - Analysis */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 00-2-2H9z"></path>
                  </svg>
                  <h2 className="text-lg font-bold">ROI Calculator</h2>
                </div>
              </div>
              
              {showAIProcessing ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p>Calculating ROI...</p>
                  </div>
                </div>
              ) : aiSuggestions && selectedParcel ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-xl p-4">
                      <p className="text-sm text-gray-400 mb-1">Total Investment</p>
                      <p className="text-xl font-bold">${(selectedParcel.value + aiSuggestions.remediationCost.max + 200000).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Acquisition + Remediation + Development</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4">
                      <p className="text-sm text-gray-400 mb-1">Projected Revenue</p>
                      <p className="text-xl font-bold">${aiSuggestions.postRemediationValue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Post-development market value</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Net Profit</p>
                      <p className="text-2xl font-bold text-teal-400">
                        ${(aiSuggestions.postRemediationValue - selectedParcel.value - aiSuggestions.remediationCost.max - 200000).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-teal-500 h-3 rounded-full" 
                        style={{width: `${Math.min(100, aiSuggestions.roi)}%`}}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Break-even</span>
                      <span>{aiSuggestions.roi}% ROI</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-400">{Math.round(aiSuggestions.remediationTimeMonths + 12)}</p>
                      <p className="text-xs text-gray-400">Months to ROI</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{Math.round(aiSuggestions.roi/12)}%</p>
                      <p className="text-xs text-gray-400">Monthly Return</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-400">{aiSuggestions.confidence}%</p>
                      <p className="text-xs text-gray-400">Confidence</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-800">
                    <h4 className="font-medium mb-3">Investment Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Land Acquisition:</span>
                        <span>${selectedParcel.value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Remediation:</span>
                        <span>${aiSuggestions.remediationCost.max.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Development:</span>
                        <span>$200,000</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-gray-700 pt-2">
                        <span>Total Investment:</span>
                        <span className="text-teal-400">${(selectedParcel.value + aiSuggestions.remediationCost.max + 200000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-400">Select a parcel and run analysis to calculate ROI</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold mb-4">Site Location</h2>
              
              {selectedParcel ? (
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-3 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p className="text-sm text-gray-400 mb-2">Mini Map View</p>
                      <p className="text-xs text-gray-500 mt-1">Coordinates: {selectedParcel.coordinates[1]}, {selectedParcel.coordinates[0]}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Address:</span>
                      <span className="text-right">{selectedParcel.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">APN:</span>
                      <span>{selectedParcel.apn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Size:</span>
                      <span>{selectedParcel.size} acres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Zoning:</span>
                      <span>{selectedParcel.zoning}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setActiveTab('map');
                      setMobileMenuOpen(false);
                      handleViewOnMap();
                    }}
                    className="w-full py-2 bg-teal-600 rounded-md hover:bg-teal-700 transition text-sm"
                  >
                    View Full Map
                  </button>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-gray-400">Select a parcel to view location details</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right column - AI suggestions */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <img src="/analysis_icon.png" alt="AI Analysis" className="w-6 h-6 mr-2" />
                  <h2 className="text-lg font-bold">AI-Powered Recommendations</h2>
                </div>
                <span className="bg-teal-900 text-teal-300 text-xs font-medium px-2.5 py-0.5 rounded-full">Natura Solve AI</span>
              </div>
              
              {showAIProcessing ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p>AI analyzing site potential...</p>
                  </div>
                </div>
              ) : aiSuggestions ? (
                <div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-1">Recommended Best Use</p>
                    <p className="text-xl font-bold text-teal-400">{aiSuggestions.bestUse}</p>
                  </div>
                  
                  {aiSuggestions.visualization && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-400 mb-2">Visualization</p>
                      <img 
                        src={aiSuggestions.visualization} 
                        alt="AI-generated site visualization" 
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Alternative Uses</p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.alternativeUses.map((use, index) => (
                        <span key={index} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-sm">
                          {use}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Key Recommendations</p>
                    <ul className="space-y-2">
                      {aiSuggestions.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-teal-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-400">Select a parcel to view AI recommendations</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold mb-4">Funding Opportunities</h2>
              
              {showAIProcessing ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p>Searching funding sources...</p>
                  </div>
                </div>
              ) : aiSuggestions?.fundingOpportunities ? (
                <div className="space-y-4">
                  {aiSuggestions.fundingOpportunities.map((funding, index) => (
                    <button 
                      key={index} 
                      className="w-full bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition text-left"
                      onClick={() => openFundingModal(funding)}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{funding.name}</h3>
                        <span className="text-teal-400 font-medium">{funding.value}</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{funding.criteria}</p>
                      {funding.website && (
                        <a 
                          href={funding.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Official Website ↗
                        </a>
                      )}
                    </button>
                  ))}
                  
                  <button 
                    className="w-full py-2 bg-gray-800 text-teal-400 rounded-md hover:bg-gray-700 transition mt-2 text-sm"
                    onClick={() => setShowAllFundingModal(true)}
                  >
                    View All Funding Options
                  </button>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-gray-400">Select a parcel to view funding opportunities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ReportsView = () => (
    <div className="p-4">
      <div className="bg-gray-900 rounded-2xl shadow-xl p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Development Reports</h2>
          
          <button 
            onClick={generateReport}
            disabled={!selectedParcel || !aiSuggestions || isLoading}
            className={`px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-md transition ${
              selectedParcel && aiSuggestions && !isLoading ? '' : 'bg-gray-700 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating PDF...
              </span>
            ) : "Generate Report"}
          </button>
        </div>
        
        {selectedParcel && aiSuggestions ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-800">Brownfield Development Summary: {selectedParcel.name}</h3>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium mb-3 text-teal-400">Site Details</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Location:</span>
                      <span>{selectedParcel.address}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">APN:</span>
                      <span>{selectedParcel.apn}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Parcel Size:</span>
                      <span>{selectedParcel.size} acres</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Current Value:</span>
                      <span>${selectedParcel.value.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Contamination:</span>
                      <span>{selectedParcel.contamination}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Level:</span>
                      <span>{selectedParcel.level}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-teal-400">Development Potential</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Recommended Use:</span>
                      <span>{aiSuggestions.bestUse}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Est. Remediation Cost:</span>
                      <span>${aiSuggestions.remediationCost.min.toLocaleString()} - ${aiSuggestions.remediationCost.max.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Remediation Timeline:</span>
                      <span>{aiSuggestions.remediationTimeMonths} months</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Post-Remediation Value:</span>
                      <span>${aiSuggestions.postRemediationValue.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-400">Projected ROI:</span>
                      <span className="text-teal-400 font-medium">{aiSuggestions.roi}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-3 text-teal-400">Development Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">1</div>
                    <div>
                      <p className="font-medium">Acquisition</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Month 1</span>
                        <span>${selectedParcel.value.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">2</div>
                    <div>
                      <p className="font-medium">Remediation</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Months 2-{aiSuggestions.remediationTimeMonths + 1}</span>
                        <span>${aiSuggestions.remediationCost.min.toLocaleString()} - ${aiSuggestions.remediationCost.max.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">3</div>
                    <div>
                      <p className="font-medium">Permitting</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Months {aiSuggestions.remediationTimeMonths + 1}-{aiSuggestions.remediationTimeMonths + 3}</span>
                        <span>$75,000 - $120,000</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">4</div>
                    <div>
                      <p className="font-medium">Construction</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Months {aiSuggestions.remediationTimeMonths + 3}-{aiSuggestions.remediationTimeMonths + 15}</span>
                        <span>Varies by build type</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">5</div>
                    <div>
                      <p className="font-medium">Completion</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Month {aiSuggestions.remediationTimeMonths + 15}</span>
                        <span className="text-teal-400">${aiSuggestions.postRemediationValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 text-teal-400">Key Recommendations</h4>
                <ul className="space-y-2 mb-6">
                  {aiSuggestions.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-teal-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
                
                <h4 className="font-medium mb-3 text-teal-400">Funding Opportunities</h4>
                <div className="space-y-2">
                  {aiSuggestions.fundingOpportunities.map((funding, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">{funding.name}</h5>
                        <span className="text-teal-400">{funding.value}</span>
                      </div>
                      <p className="text-sm text-gray-400">{funding.criteria}</p>
                      {funding.website && (
                        <a 
                          href={funding.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Official Website ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {aiSuggestions.visualization && (
              <div>
                <h4 className="font-medium mb-3 text-teal-400">Site Visualization</h4>
                <div className="bg-gray-800 p-2 rounded-lg">
                  <img 
                    src={aiSuggestions.visualization} 
                    alt="AI-generated site visualization" 
                    className="w-full rounded-lg"
                  />
                  <p className="text-center text-sm text-gray-400 mt-2">
                    AI-generated visualization of {selectedParcel.name} redeveloped as {aiSuggestions.bestUse}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4 border-t border-gray-800">
              <button 
                onClick={generateReport}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-md transition"
              >
                Export PDF Report
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No Report Available</h3>
            <p className="text-gray-400 mb-6">
              Select a parcel from the map view and run the analysis first to generate a development report.
            </p>
            <button 
              onClick={() => setActiveTab('map')}
              className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition"
            >
              Go to Map View
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="p-4">
      <div className="bg-gray-900 rounded-2xl shadow-xl p-6 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-800">Settings</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Map Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default Map Style</p>
                  <p className="text-sm text-gray-400">Choose the default style for the map visualization</p>
                </div>
                <select className="bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>Dark</option>
                  <option>Light</option>
                  <option>Satellite</option>
                  <option>Terrain</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default Location</p>
                  <p className="text-sm text-gray-400">Set the default map center coordinates</p>
                </div>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Longitude" 
                    className="w-28 bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    defaultValue="-111.93"
                  />
                  <input 
                    type="text" 
                    placeholder="Latitude" 
                    className="w-28 bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    defaultValue="41.185"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Analysis Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default Risk Tolerance</p>
                  <p className="text-sm text-gray-400">Set the default risk tolerance for analyses</p>
                </div>
                <div className="w-64">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    defaultValue="50" 
                    className="custom-slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Low Risk</span>
                    <span>Balanced</span>
                    <span>High Risk</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default Years to Develop</p>
                  <p className="text-sm text-gray-400">Set the default development timeline</p>
                </div>
                <select className="bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>1 year</option>
                  <option>2 years</option>
                  <option selected>3 years</option>
                  <option>5 years</option>
                  <option>10 years</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Inflation Rate Adjustment</p>
                  <p className="text-sm text-gray-400">Annual inflation rate for cost projections</p>
                </div>
                <input 
                  type="text" 
                  placeholder="%" 
                  className="w-28 bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  defaultValue="3.5"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">User Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-gray-400">Choose the application theme</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-gray-800 text-teal-400 border border-teal-400 rounded-md">Dark</button>
                  <button className="px-3 py-1 bg-gray-800 text-gray-400 rounded-md hover:bg-gray-700">Light</button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">API Updates</p>
                  <p className="text-sm text-gray-400">Automatically sync with external data sources</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notification Preferences</p>
                  <p className="text-sm text-gray-400">Receive updates about site changes</p>
                </div>
                <select className="bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>All notifications</option>
                  <option selected>Important only</option>
                  <option>None</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-800">
            <button className="px-4 py-2 bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700 transition mr-3">
              Reset to Defaults
            </button>
            <button className="px-4 py-2 bg-teal-600 rounded-md hover:bg-teal-700 transition">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Upload Modal Component
  const UploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Upload Environmental Report</h3>
          <button 
            onClick={() => setShowUploadModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <p className="text-gray-400 mb-6">
          Upload environmental assessment reports for AI processing. Supported formats: PDF, DOCX.
        </p>
        
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center mb-6">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          
          <p className="text-sm text-gray-400 mb-2">Drag and drop files here or</p>
          
          <label className="px-4 py-2 bg-teal-600 rounded-md hover:bg-teal-700 transition text-sm inline-block cursor-pointer">
            Browse Files
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.docx"
              onChange={(e) => handleFileUpload(e.target.files[0])}
            />
          </label>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={() => setShowUploadModal(false)}
            className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-teal-600 rounded-md hover:bg-teal-700 transition"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : "Upload & Analyze"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navigation />
      
      {activeTab === 'map' && <MapView />}
      {activeTab === 'analyzer' && <AnalyzerView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'settings' && <SettingsView />}
      
      {showUploadModal && <UploadModal />}
      {showFundingModal && <FundingModal />}
      {showAllFundingModal && <AllFundingModal />}
    </>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);