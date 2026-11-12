import type { AnomalyType, CropType, Language, ReportCategory, VerificationStatus } from '../types/telemetry';

export interface TranslationBundle {
  brandTitle: string;
  nav: {
    gis: string;
    hydrology: string;
    wildfire: string;
    analytics: string;
    architecture: string;
  };
  primaryCta: string;
  toolbar: {
    connectivityOnline: string;
    connectivityOffline: string;
    simulateOffline: string;
    syncPending: string;
    queuedLabel: string;
    ecosystemFocus: string;
  };
  gis: {
    title: string;
    subtitle: string;
    kpiAnomalies: string;
    kpiStations: string;
    kpiMeanNdvi: string;
    kpiReservoirAvg: string;
    filterAll: string;
    spectralMode: string;
    yearScrubber: string;
    layersTitle: string;
    layerAnomalies: string;
    layerGreenDam: string;
    layerSandVectors: string;
    layerStations: string;
    layerReservoirs: string;
    layerReports: string;
    mapHint: string;
    severityLabel: string;
    wilayaTableTitle: string;
    colWilaya: string;
    colNdvi: string;
    colNdwi: string;
    colLst: string;
    colDesertFront: string;
  };
  hydrology: {
    title: string;
    subtitle: string;
    damsTitle: string;
    colDam: string;
    colWilaya: string;
    colCapacity: string;
    colFill: string;
    colInOut: string;
    colGroundwater: string;
    droughtTitle: string;
    droughtScore: string;
    floodScore: string;
    advisoryTitle: string;
    cropLabel: string;
    et0Label: string;
    soilMoistureLabel: string;
    areaLabel: string;
    etcOutput: string;
    recommendedIrr: string;
    waterSaved: string;
    scheduleLabel: string;
    schedules: {
      immediate_drip: string;
      scheduled_night: string;
      hold_irrigation: string;
    };
  };
  wildfire: {
    title: string;
    subtitle: string;
    fwiCalculatorTitle: string;
    selectStation: string;
    tempLabel: string;
    humidityLabel: string;
    windLabel: string;
    drynessLabel: string;
    computeButton: string;
    fwiScoreLabel: string;
    dispatchTitle: string;
    reportsTitle: string;
    noReports: string;
    verifyAction: string;
    resolveAction: string;
    anonymousTag: string;
    offlineSyncedTag: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    chartTitle: string;
    range30d: string;
    range1y: string;
    range10y: string;
    metricTemp: string;
    metricNdvi: string;
    metricWater: string;
    simulatorTitle: string;
    sliderReforestation: string;
    sliderIrrigation: string;
    sliderGroundwater: string;
    outCarbon: string;
    outWaterResilience: string;
    outDesertHalted: string;
    outNdviDelta: string;
  };
  architecture: {
    title: string;
    subtitle: string;
    schemaTitle: string;
    copySql: string;
    copiedSql: string;
    apiTesterTitle: string;
    runRequest: string;
    responseLabel: string;
  };
  widget: {
    title: string;
    subtitle: string;
    streamLive: string;
    streamConnecting: string;
    streamPaused: string;
    selectStationsLabel: string;
    tempTitle: string;
    humidityTitle: string;
    range60m: string;
    noStationsSelected: string;
    lastPing: string;
  };
  climateDashboard: {
    title: string;
    subtitle: string;
    statusWarning: string;
    statusNominal: string;
    kpiFwiTitle: string;
    kpiFwiNote: string;
    kpiNdviTitle: string;
    kpiNdviNote: string;
    kpiWaterTitle: string;
    kpiWaterNote: string;
    fwiChartTitle: string;
    ndviChartTitle: string;
  };
  modal: {
    title: string;
    coordsCaptured: string;
    useGps: string;
    categoryLabel: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    photoLabel: string;
    anonymousLabel: string;
    cancel: string;
    submit: string;
    submitOffline: string;
    validationDetails: string;
    validationCoords: string;
    successOnline: string;
    successOffline: string;
  };
  anomalies: Record<AnomalyType, string>;
  categories: Record<ReportCategory, string>;
  statuses: Record<VerificationStatus, string>;
  crops: Record<CropType, string>;
}

export const TRANSLATIONS: Record<Language, TranslationBundle> = {
  ar: {
    brandTitle: 'منظومة السيادة البيئية',
    nav: {
      gis: 'المرصد الجغرافي',
      hydrology: 'الشبكة المائية',
      wildfire: 'درع الحرائق والبلاغات',
      analytics: 'التحليلات والمحاكاة',
      architecture: 'قاعدة البيانات والـ API',
    },
    primaryCta: 'تسجيل بلاغ ميداني',
    toolbar: {
      connectivityOnline: 'متصل بالخادم المكاني',
      connectivityOffline: 'وضع عدم الاتصال (تخزين محلي)',
      simulateOffline: 'محاكاة انقطاع الشبكة',
      syncPending: 'مزامنة البلاغات المعلقة',
      queuedLabel: 'معلق محلياً',
      ecosystemFocus: 'النطاق البيئي: المتوسطي ← الهضاب العليا ← الصحراوي',
    },
    gis: {
      title: 'المرصد الجغرافي للتصحر والغطاء النباتي',
      subtitle: 'رصد فضائي لحظي لمؤشرات الغطاء النباتي (NDVI) والمياه (NDWI) وحرارة السطح (LST)',
      kpiAnomalies: 'البؤر البيئية النشطة',
      kpiStations: 'محطات الاستشعار المتصلة',
      kpiMeanNdvi: 'متوسط مؤشر الغطاء النباتي',
      kpiReservoirAvg: 'معدل امتلاء السدود',
      filterAll: 'الكل',
      spectralMode: 'الطبقة الطيفية',
      yearScrubber: 'المقارنة الزمنية',
      layersTitle: 'طبقات الخريطة',
      layerAnomalies: 'البؤر والمخاطر',
      layerGreenDam: 'حزام السد الأخضر',
      layerSandVectors: 'محاور زحف الرمال',
      layerStations: 'محطات الرصد IoT',
      layerReservoirs: 'السدود والخزانات',
      layerReports: 'البلاغات الميدانية',
      mapHint: 'انقر في أي نقطة على الخريطة لالتقاط الإحداثيات وتسجيل بلاغ ميداني مشفر',
      severityLabel: 'درجة الخطورة',
      wilayaTableTitle: 'مصفوفة المؤشرات المناخية حسب الولاية',
      colWilaya: 'الولاية',
      colNdvi: 'NDVI',
      colNdwi: 'NDWI',
      colLst: 'حرارة السطح',
      colDesertFront: 'تقدم التصحر',
    },
    hydrology: {
      title: 'الشبكة الذكية لإدارة الإجهاد المائي والتنبؤ بالسيول',
      subtitle: 'توازن المخزون المائي للسدود، استنزاف المياه الجوفية، وحساب التبخر-نتح الزراعي الدقيق',
      damsTitle: 'مراقبة مخزون السدود الكبرى',
      colDam: 'السد / الخزان',
      colWilaya: 'الولاية',
      colCapacity: 'السعة (مليون م³)',
      colFill: 'نسبة الامتلاء',
      colInOut: 'الوارد / المنصرف (م³/ث)',
      colGroundwater: 'تراجع الجوفية (م/سنة)',
      droughtTitle: 'تقييم مخاطر الجفاف والسيول الفجائية حسب الولاية',
      droughtScore: 'مؤشر الجفاف',
      floodScore: 'خطر السيول الفجائية',
      advisoryTitle: 'مستشار الري الزراعي الدقيق (معادلة ETc)',
      cropLabel: 'المحصول الاستراتيجي',
      et0Label: 'التبخر المرجعي ET0 (مم/يوم)',
      soilMoistureLabel: 'رطوبة التربة المقاسة (%)',
      areaLabel: 'المساحة المزروعة (هكتار)',
      etcOutput: 'التبخر-نتح المحصولي ETc',
      recommendedIrr: 'الاحتياج الموصى به (بالتقطير)',
      waterSaved: 'الوفر المائي اليومي المحقق',
      scheduleLabel: 'التوصية التشغيلية',
      schedules: {
        immediate_drip: 'تفعيل الري بالتقطير فوراً عند الفجر',
        scheduled_night: 'جدولة الري الليلي المقتصد',
        hold_irrigation: 'تأجيل الري — رطوبة التربة كافية',
      },
    },
    wildfire: {
      title: 'نظام الإنذار المبكر لحرائق الغابات والبلاغات الميدانية المشفرة',
      subtitle: 'محرك حساب مؤشر خطر الحرائق (FWI) وإطلاق تنبيهات التدخل السريع والبلاغات الميدانية',
      fwiCalculatorTitle: 'محرك حساب مؤشر خطر الحرائق (FWI Engine)',
      selectStation: 'استيراد قراءة من محطة رصد',
      tempLabel: 'درجة الحرارة (°C)',
      humidityLabel: 'الرطوبة النسبية (%)',
      windLabel: 'سرعة الرياح (كم/س)',
      drynessLabel: 'مؤشر جفاف الوقود النباتي',
      computeButton: 'حساب مؤشر الخطر وإرسال التقييم',
      fwiScoreLabel: 'نتيجة مؤشر FWI',
      dispatchTitle: 'سجل التنبيهات الآلية لفرق التدخل (Webhooks)',
      reportsTitle: 'سجل البلاغات الميدانية المشفرة',
      noReports: 'لا توجد بلاغات ميدانية مسجلة بعد.',
      verifyAction: 'تأكيد ميداني',
      resolveAction: 'إغلاق البلاغ',
      anonymousTag: 'هوية مشفرة ومحمية',
      offlineSyncedTag: 'تمت مزامنته من وضع عدم الاتصال',
    },
    analytics: {
      title: 'لوحة التحليلات التنفيذية ومحاكاة السياسات المناخية',
      subtitle: 'منحنيات التغير المناخي (D3.js) ونموذج استشراف أثر التدخلات البيئية بحلول 2035',
      chartTitle: 'منحنى المؤشرات المناخية متعددة المتغيرات',
      range30d: '30 يوماً',
      range1y: 'سنة واحدة',
      range10y: 'توقعات 10 سنوات',
      metricTemp: 'شذوذ الحرارة (°C+)',
      metricNdvi: 'متوسط NDVI',
      metricWater: 'مخزون السدود (%)',
      simulatorTitle: 'محاكي أثر السياسات والتدخلات الاستراتيجية (أفق 2035)',
      sliderReforestation: 'توسيع تشجير السد الأخضر (هكتار)',
      sliderIrrigation: 'تقليص هدر الري الفلاحي (%)',
      sliderGroundwater: 'ترشيد ضخ المياه الجوفية (%)',
      outCarbon: 'القدرة السنوية لامتصاص الكربون',
      outWaterResilience: 'تحسن مؤشر المرونة المائية',
      outDesertHalted: 'المساحة المحمية من التصحر',
      outNdviDelta: 'التحسن المتوقع في مؤشر NDVI',
    },
    architecture: {
      title: 'المخطط التقني وقاعدة البيانات المكانية (PostGIS) والـ API',
      subtitle: 'بنية الجداول الجغرافية مع فهارس GIST وواجهة اختبار نقاط النهاية الحية',
      schemaTitle: 'هيكلة قاعدة البيانات المكانية (PostgreSQL + PostGIS DDL)',
      copySql: 'نسخ كود SQL',
      copiedSql: 'تم النسخ',
      apiTesterTitle: 'مختبر واجهات البرمجة الحية (REST API)',
      runRequest: 'تنفيذ الطلب الحي',
      responseLabel: 'استجابة الخادم (JSON)',
    },
    widget: {
      title: 'بث قياسات المحطات الحية (آخر 60 دقيقة)',
      subtitle: 'تدفق لحظي لدرجات الحرارة والرطوبة النسبية عبر قناة Server-Sent Events من الخادم المكاني',
      streamLive: 'بث مباشر متصل',
      streamConnecting: 'جاري الاتصال بالبث...',
      streamPaused: 'البث متوقف (وضع عدم الاتصال)',
      selectStationsLabel: 'المحطات المختارة للعرض:',
      tempTitle: 'درجة الحرارة (60 د)',
      humidityTitle: 'الرطوبة النسبية (60 د)',
      range60m: 'المدى',
      noStationsSelected: 'اختر محطة واحدة على الأقل لعرض المخططات اللحظية.',
      lastPing: 'آخر إشارة',
    },
    climateDashboard: {
      title: 'مرصد التحليلات البيئية والمناخية (D3.js Analytics)',
      subtitle: 'تتبع مؤشرات خطر الحرائق، تراجع الغطاء النباتي (NDVI)، والإجهاد المائي عبر النطاق الزمني المختار',
      statusWarning: 'الحالة الاستراتيجية: إنذار مبكر نشط',
      statusNominal: 'الحالة الاستراتيجية: مراقبة مستقرة',
      kpiFwiTitle: 'متوسط مؤشر خطر الحرائق (FWI)',
      kpiFwiNote: 'عن بداية الفترة',
      kpiNdviTitle: 'مؤشر الغطاء النباتي (NDVI)',
      kpiNdviNote: 'تغير الغطاء النباتي',
      kpiWaterTitle: 'مؤشر الإجهاد والشح المائي',
      kpiWaterNote: 'ضغط على الآبار والسدود',
      fwiChartTitle: 'منحنى تطور خطر الحرائق (FWI) مقابل الإجهاد المائي',
      ndviChartTitle: 'تطور مؤشر الغطاء النباتي (NDVI Index Trend)',
    },
    modal: {
      title: 'تسجيل بلاغ بيئي ميداني مشفر',
      coordsCaptured: 'الإحداثيات الجغرافية الملتقطة',
      useGps: 'التقاط GPS تلقائي',
      categoryLabel: 'تصنيف الخطر البيئي',
      detailsLabel: 'تفاصيل الملاحظة الميدانية',
      detailsPlaceholder: 'صف الحالة بدقة (اتجاه الدخان، حجم الضرر، نوع التجاوز)...',
      photoLabel: 'إرفاق صورة ميدانية للتحقق (اختياري)',
      anonymousLabel: 'تشفير كامل للهوية وإرسال مجهول (AES-GCM)',
      cancel: 'إلغاء',
      submit: 'إرسال البلاغ المشفر',
      submitOffline: 'حفظ في الذاكرة المحلية للمزامنة لاحقاً',
      validationDetails: 'يرجى إدخال وصف ميداني لا يقل عن 5 أحرف.',
      validationCoords: 'الإحداثيات الجغرافية غير صالحة.',
      successOnline: 'تم تشفير البلاغ وإرساله إلى غرفة العمليات المكانية بنجاح.',
      successOffline: 'تم حفظ البلاغ محلياً بنجاح وسيتم إرساله تلقائياً فور عودة الاتصال.',
    },
    anomalies: {
      wildfire_risk: 'خطر حرائق غابات',
      desertification_hotspot: 'بؤرة تصحر وزحف رمال',
      water_stress: 'إجهاد وشح مائي',
    },
    categories: {
      smoke_alert: 'تصاعد دخان / بداية حريق غابة',
      illegal_logging: 'قطع أشجار غير شرعي',
      water_leak: 'هدر مائي أو تلوث مجرى مائي',
      sand_encroachment: 'تقدم كثبان رملية على منشأة أو طريق',
    },
    statuses: {
      pending_inspection: 'قيد الانتظار',
      under_inspection: 'قيد المعاينة الميدانية',
      verified: 'مؤكد ميدانياً',
      resolved: 'تمت المعالجة',
    },
    crops: {
      olive: 'الزيتون (بساتين المتوسط والهضاب)',
      date_palm: 'النخيل الصحراوي (الواحات)',
      durum_wheat: 'القمح الصلب (السهول العليا)',
      citrus: 'الحمضيات (السهول الساحلية)',
      steppe_forage: 'المراعي السهبية وشجيرات التثبيت',
    },
  },
  en: {
    brandTitle: 'Eco-Sovereign Telemetry',
    nav: {
      gis: 'GIS Monitor',
      hydrology: 'Water Grid',
      wildfire: 'Wildfire & Reports',
      analytics: 'Analytics & Sim',
      architecture: 'Schema & API',
    },
    primaryCta: 'Submit Field Report',
    toolbar: {
      connectivityOnline: 'Spatial Server Connected',
      connectivityOffline: 'Offline Mode (Local Queue)',
      simulateOffline: 'Simulate Offline',
      syncPending: 'Sync Queued Reports',
      queuedLabel: 'queued locally',
      ecosystemFocus: 'Transect: Mediterranean -> High Plateaus -> Saharan',
    },
    gis: {
      title: 'Desertification & Vegetation Telemetry Hub',
      subtitle: 'Near-real-time NDVI vegetation, NDWI water stress, and Land Surface Temperature (LST) GIS monitor',
      kpiAnomalies: 'Active Spatial Anomalies',
      kpiStations: 'Connected IoT Stations',
      kpiMeanNdvi: 'Regional Mean NDVI',
      kpiReservoirAvg: 'Mean Reservoir Fill',
      filterAll: 'All',
      spectralMode: 'Spectral Layer',
      yearScrubber: 'Time-Series Comparison',
      layersTitle: 'GIS Vector Layers',
      layerAnomalies: 'Hazard Hotspots',
      layerGreenDam: 'Green Dam Corridor',
      layerSandVectors: 'Sand Drift Vectors',
      layerStations: 'IoT Telemetry Nodes',
      layerReservoirs: 'Dams & Reservoirs',
      layerReports: 'Field Reports',
      mapHint: 'Click anywhere on the map to capture coordinates and submit an encrypted field report',
      severityLabel: 'Severity Level',
      wilayaTableTitle: 'Wilaya Multi-Spectral Matrix',
      colWilaya: 'Wilaya',
      colNdvi: 'NDVI',
      colNdwi: 'NDWI',
      colLst: 'Surface Temp',
      colDesertFront: 'Sand Advance',
    },
    hydrology: {
      title: 'Smart Hydrological & Water Stress Management Grid',
      subtitle: 'Dam reservoir telemetry, aquifer drawdown rates, drought/flash-flood forecasting, and crop ETc advisory',
      damsTitle: 'Strategic Reservoir Telemetry',
      colDam: 'Reservoir',
      colWilaya: 'Wilaya',
      colCapacity: 'Capacity (Mm³)',
      colFill: 'Fill Level',
      colInOut: 'Inflow / Outflow (m³/s)',
      colGroundwater: 'Aquifer Drop (m/yr)',
      droughtTitle: 'Wilaya Drought & Flash-Flood Risk Forecast',
      droughtScore: 'Drought Risk',
      floodScore: 'Flash-Flood Risk',
      advisoryTitle: 'Precision Agricultural Irrigation Advisory (ETc)',
      cropLabel: 'Strategic Crop',
      et0Label: 'Reference ET0 (mm/day)',
      soilMoistureLabel: 'Measured Soil Moisture (%)',
      areaLabel: 'Irrigated Area (Hectares)',
      etcOutput: 'Crop Evapotranspiration (ETc)',
      recommendedIrr: 'Recommended Drip Volume',
      waterSaved: 'Daily Water Saved vs. Flood',
      scheduleLabel: 'Operational Schedule',
      schedules: {
        immediate_drip: 'Trigger Immediate Dawn Drip Cycle',
        scheduled_night: 'Schedule Nocturnal Deficit Irrigation',
        hold_irrigation: 'Hold Irrigation — Soil Moisture Sufficient',
      },
    },
    wildfire: {
      title: 'Wildfire Early Warning & Encrypted Field Shield',
      subtitle: 'Real-time Fire Weather Index (FWI) computation, automated dispatch webhooks, and anonymous field reports',
      fwiCalculatorTitle: 'Fire Weather Index (FWI) Engine',
      selectStation: 'Load Telemetry from Station',
      tempLabel: 'Ambient Temp (°C)',
      humidityLabel: 'Relative Humidity (%)',
      windLabel: 'Wind Speed (km/h)',
      drynessLabel: 'Fuel Dryness Index',
      computeButton: 'Evaluate FWI & Trigger Dispatch',
      fwiScoreLabel: 'Computed FWI Score',
      dispatchTitle: 'Automated Intervention Dispatch Log',
      reportsTitle: 'Encrypted Geo-Tagged Field Reports',
      noReports: 'No field reports submitted yet.',
      verifyAction: 'Verify Field Report',
      resolveAction: 'Mark Resolved',
      anonymousTag: 'Anonymous & Encrypted',
      offlineSyncedTag: 'Synced from Offline Cache',
    },
    analytics: {
      title: 'Executive Analytics & Climate Policy Simulator',
      subtitle: 'Multi-variable D3.js climate trend projections and 2035 intervention modeling',
      chartTitle: 'Multi-Variable Climate Trajectory (D3.js)',
      range30d: '30 Days',
      range1y: '1 Year',
      range10y: '10-Year Projection',
      metricTemp: 'Temp Anomaly (+°C)',
      metricNdvi: 'Mean NDVI',
      metricWater: 'Dam Fill (%)',
      simulatorTitle: '2035 Policy Intervention Simulator',
      sliderReforestation: 'Green Dam Reforestation (Hectares)',
      sliderIrrigation: 'Agricultural Water Waste Reduction (%)',
      sliderGroundwater: 'Aquifer Extraction Quota Reduction (%)',
      outCarbon: 'Annual Carbon Sequestration',
      outWaterResilience: 'Water Resilience Gain',
      outDesertHalted: 'Desertification Halted',
      outNdviDelta: 'Projected 2035 NDVI Gain',
    },
    architecture: {
      title: 'PostGIS Spatial Schema & Live REST API Inspector',
      subtitle: 'PostgreSQL/PostGIS DDL definitions with GIST spatial indexing and interactive endpoint testing',
      schemaTitle: 'Spatial Database DDL (PostgreSQL + PostGIS)',
      copySql: 'Copy SQL',
      copiedSql: 'Copied',
      apiTesterTitle: 'Live Backend Endpoint Tester',
      runRequest: 'Execute Live Request',
      responseLabel: 'Server Response (JSON)',
    },
    widget: {
      title: 'Live Station Telemetry Stream (Last 60 Minutes)',
      subtitle: 'Server-Sent Events rolling telemetry stream for temperature and relative humidity across selected IoT nodes',
      streamLive: 'Live Stream',
      streamConnecting: 'Connecting stream...',
      streamPaused: 'Stream Paused (Offline)',
      selectStationsLabel: 'Selected Stations:',
      tempTitle: 'Temperature (60m)',
      humidityTitle: 'Humidity (60m)',
      range60m: 'Range',
      noStationsSelected: 'Select at least one telemetry station to inspect its 60-minute sparklines.',
      lastPing: 'Last ping',
    },
    climateDashboard: {
      title: 'Environmental & Climate Analytics Observatory (D3.js)',
      subtitle: 'Tracking Fire Weather Index (FWI), vegetation NDVI trajectory, and hydrological stress across the selected horizon',
      statusWarning: 'Strategic Status: Active Early Warning',
      statusNominal: 'Strategic Status: Nominal Watch',
      kpiFwiTitle: 'Mean Fire Weather Index (FWI)',
      kpiFwiNote: 'vs period start',
      kpiNdviTitle: 'Vegetation Index (NDVI)',
      kpiNdviNote: 'canopy delta',
      kpiWaterTitle: 'Water Stress Index',
      kpiWaterNote: 'reservoir & aquifer load',
      fwiChartTitle: 'Fire Risk (FWI) vs. Water Stress Trajectory',
      ndviChartTitle: 'Vegetation Index (NDVI) Area Trend',
    },
    modal: {
      title: 'Submit Encrypted Geo-Tagged Field Report',
      coordsCaptured: 'Captured GPS Coordinates',
      useGps: 'Auto-Detect GPS',
      categoryLabel: 'Environmental Hazard Category',
      detailsLabel: 'Field Observation Details',
      detailsPlaceholder: 'Describe smoke plume direction, encroachment, or infrastructure breach...',
      photoLabel: 'Attach Field Verification Photo (Optional)',
      anonymousLabel: 'Encrypt reporter identity (Anonymous AES-GCM)',
      cancel: 'Cancel',
      submit: 'Transmit Encrypted Report',
      submitOffline: 'Save to Offline Sync Queue',
      validationDetails: 'Please enter at least 5 characters describing the incident.',
      validationCoords: 'Coordinates must be valid latitude/longitude values.',
      successOnline: 'Report encrypted and transmitted to operations command.',
      successOffline: 'Report cached locally and queued for automatic background sync.',
    },
    anomalies: {
      wildfire_risk: 'Wildfire Risk',
      desertification_hotspot: 'Desertification Hotspot',
      water_stress: 'Water Stress',
    },
    categories: {
      smoke_alert: 'Smoke Plume / Wildfire Ignition',
      illegal_logging: 'Illegal Logging / Deforestation',
      water_leak: 'Water Main Leak / Contamination',
      sand_encroachment: 'Active Sand Dune Encroachment',
    },
    statuses: {
      pending_inspection: 'Pending Inspection',
      under_inspection: 'Under Inspection',
      verified: 'Field Verified',
      resolved: 'Resolved',
    },
    crops: {
      olive: 'Olive Groves',
      date_palm: 'Date Palm Oases',
      durum_wheat: 'Durum Wheat',
      citrus: 'Coastal Citrus',
      steppe_forage: 'Steppe Forage Shrubs',
    },
  },
  fr: {
    brandTitle: 'Souveraineté Éco-Climatique',
    nav: {
      gis: 'Moniteur SIG',
      hydrology: 'Réseau Hydrique',
      wildfire: 'Feux & Signalements',
      analytics: 'Analytique & Sim',
      architecture: 'Schéma & API',
    },
    primaryCta: 'Signaler un Incident',
    toolbar: {
      connectivityOnline: 'Serveur Spatial Connecté',
      connectivityOffline: 'Mode Hors-Ligne (File Locale)',
      simulateOffline: 'Simuler Hors-Ligne',
      syncPending: 'Synchroniser la File',
      queuedLabel: 'en attente locale',
      ecosystemFocus: 'Transect : Méditerranéen -> Hauts Plateaux -> Saharien',
    },
    gis: {
      title: 'Observatoire SIG de Désertification et Végétation',
      subtitle: 'Télédétection temps réel NDVI, stress hydrique NDWI et température de surface (LST)',
      kpiAnomalies: 'Anomalies Actives',
      kpiStations: 'Stations IoT Actives',
      kpiMeanNdvi: 'NDVI Moyen Régional',
      kpiReservoirAvg: 'Remplissage Barrages',
      filterAll: 'Tout',
      spectralMode: 'Indice Spectral',
      yearScrubber: 'Comparaison Temporelle',
      layersTitle: 'Couches Vectorielles SIG',
      layerAnomalies: 'Foyers de Risque',
      layerGreenDam: 'Corridor Barrage Vert',
      layerSandVectors: 'Vecteurs Ensablement',
      layerStations: 'Stations IoT',
      layerReservoirs: 'Barrages & Réservoirs',
      layerReports: 'Signalements Terrain',
      mapHint: 'Cliquez sur la carte pour capturer les coordonnées GPS et envoyer un signalement chiffré',
      severityLabel: 'Niveau de Gravité',
      wilayaTableTitle: 'Matrice Climatique par Wilaya',
      colWilaya: 'Wilaya',
      colNdvi: 'NDVI',
      colNdwi: 'NDWI',
      colLst: 'Temp. Surface',
      colDesertFront: 'Avancée Sable',
    },
    hydrology: {
      title: 'Grille Intelligente de Gestion Hydrique et Stress',
      subtitle: 'Suivi des barrages, rabattement des nappes, risque sécheresse/crue éclair et conseil ETc',
      damsTitle: 'Télémétrie des Barrages Stratégiques',
      colDam: 'Barrage',
      colWilaya: 'Wilaya',
      colCapacity: 'Capacité (Mm³)',
      colFill: 'Remplissage',
      colInOut: 'Apport / Lâcher (m³/s)',
      colGroundwater: 'Baisse Nappe (m/an)',
      droughtTitle: 'Prévision Sécheresse et Crues Éclairs par Wilaya',
      droughtScore: 'Risque Sécheresse',
      floodScore: 'Risque Crue Éclair',
      advisoryTitle: 'Conseil Agricole de Précision (ETc)',
      cropLabel: 'Culture Stratégique',
      et0Label: 'ET0 de Référence (mm/j)',
      soilMoistureLabel: 'Humidité du Sol (%)',
      areaLabel: 'Surface Irriguée (ha)',
      etcOutput: 'Évapotranspiration Culture (ETc)',
      recommendedIrr: 'Volume Goutte-à-Goutte',
      waterSaved: 'Économie Quotidienne',
      scheduleLabel: 'Programme Recommandé',
      schedules: {
        immediate_drip: 'Activer Goutte-à-Goutte Immédiat à l’Aube',
        scheduled_night: 'Planifier Irrigation Nocturne',
        hold_irrigation: 'Suspendre — Humidité Suffisante',
      },
    },
    wildfire: {
      title: 'Alerte Précoce Feux de Forêt et Bouclier Terrain',
      subtitle: 'Moteur d’Indice Météo-Incendie (FWI), alertes automatiques et signalements chiffrés',
      fwiCalculatorTitle: 'Moteur Fire Weather Index (FWI)',
      selectStation: 'Charger une Station IoT',
      tempLabel: 'Température (°C)',
      humidityLabel: 'Humidité Relative (%)',
      windLabel: 'Vitesse Vent (km/h)',
      drynessLabel: 'Sécheresse Combustible',
      computeButton: 'Calculer FWI et Alerter',
      fwiScoreLabel: 'Score FWI Calculé',
      dispatchTitle: 'Journal des Alertes Automatiques (Webhooks)',
      reportsTitle: 'Signalements Terrain Chiffrés',
      noReports: 'Aucun signalement enregistré.',
      verifyAction: 'Vérifier',
      resolveAction: 'Clôturer',
      anonymousTag: 'Anonyme & Chiffré',
      offlineSyncedTag: 'Synchronisé depuis Cache Hors-Ligne',
    },
    analytics: {
      title: 'Analytique Exécutive et Simulateur de Politiques',
      subtitle: 'Courbes climatiques D3.js et simulation d’impact des interventions à l’horizon 2035',
      chartTitle: 'Trajectoires Climatiques Multi-Variables (D3.js)',
      range30d: '30 Jours',
      range1y: '1 An',
      range10y: 'Projection 10 Ans',
      metricTemp: 'Anomalie Temp (°C+)',
      metricNdvi: 'NDVI Moyen',
      metricWater: 'Remplissage (%)',
      simulatorTitle: 'Simulateur d’Interventions Stratégiques 2035',
      sliderReforestation: 'Reboisement Barrage Vert (Hectares)',
      sliderIrrigation: 'Réduction Pertes Irrigation (%)',
      sliderGroundwater: 'Réduction Pompage Nappes (%)',
      outCarbon: 'Séquestration Carbone Annuelle',
      outWaterResilience: 'Gain Résilience Hydrique',
      outDesertHalted: 'Désertification Contenue',
      outNdviDelta: 'Gain NDVI Projeté 2035',
    },
    architecture: {
      title: 'Schéma Spatial PostGIS et Testeur API REST',
      subtitle: 'Modèle relationnel spatial avec index GIST et appels temps réel aux points de terminaison',
      schemaTitle: 'DDL Base de Données Spatiale (PostgreSQL + PostGIS)',
      copySql: 'Copier SQL',
      copiedSql: 'Copié',
      apiTesterTitle: 'Testeur API Backend en Direct',
      runRequest: 'Exécuter Requête',
      responseLabel: 'Réponse Serveur (JSON)',
    },
    widget: {
      title: 'Flux Télémétrie Stations en Direct (60 Dernières Min)',
      subtitle: 'Flux SSE en temps réel des courbes de température et d’humidité relative des stations IoT sélectionnées',
      streamLive: 'Flux en Direct',
      streamConnecting: 'Connexion au flux...',
      streamPaused: 'Flux en Pause (Hors-Ligne)',
      selectStationsLabel: 'Stations Sélectionnées :',
      tempTitle: 'Température (60 min)',
      humidityTitle: 'Humidité Relative (60 min)',
      range60m: 'Plage',
      noStationsSelected: 'Sélectionnez au moins une station pour afficher ses sparklines 60 minutes.',
      lastPing: 'Dernier signal',
    },
    climateDashboard: {
      title: 'Observatoire Analytique Environnemental (D3.js)',
      subtitle: 'Suivi de l’indice incendie (FWI), de la couverture végétale (NDVI) et du stress hydrique',
      statusWarning: 'Statut Stratégique : Alerte Précoce Active',
      statusNominal: 'Statut Stratégique : Surveillance Nominale',
      kpiFwiTitle: 'Indice Moyen Feu (FWI)',
      kpiFwiNote: 'vs début période',
      kpiNdviTitle: 'Indice Végétation (NDVI)',
      kpiNdviNote: 'variation NDVI',
      kpiWaterTitle: 'Indice de Stress Hydrique',
      kpiWaterNote: 'pression barrages & nappes',
      fwiChartTitle: 'Évolution Risque Incendie (FWI) vs Stress Hydrique',
      ndviChartTitle: 'Tendance de l’Indice Végétal (NDVI)',
    },
    modal: {
      title: 'Enregistrer un Signalement Terrain Chiffré',
      coordsCaptured: 'Coordonnées GPS Capturées',
      useGps: 'Détecter GPS',
      categoryLabel: 'Catégorie du Risque',
      detailsLabel: 'Observations de Terrain',
      detailsPlaceholder: 'Décrivez la fumée, coupe illégale ou fuite hydraulique...',
      photoLabel: 'Joindre Photo de Vérification (Optionnel)',
      anonymousLabel: 'Chiffrement complet de l’identité (AES-GCM)',
      cancel: 'Annuler',
      submit: 'Transmettre Signalement Chiffré',
      submitOffline: 'Enregistrer Hors-Ligne',
      validationDetails: 'Veuillez saisir au moins 5 caractères.',
      validationCoords: 'Coordonnées géographiques invalides.',
      successOnline: 'Signalement chiffré et transmis au centre opérationnel.',
      successOffline: 'Signalement sauvegardé hors-ligne pour synchronisation automatique.',
    },
    anomalies: {
      wildfire_risk: 'Risque Incendie',
      desertification_hotspot: 'Foyer Désertification',
      water_stress: 'Stress Hydrique',
    },
    categories: {
      smoke_alert: 'Panache de Fumée / Départ de Feu',
      illegal_logging: 'Coupe Illégale / Déforestation',
      water_leak: 'Fuite Hydraulique / Pollution',
      sand_encroachment: 'Avancée Dunaire / Ensablement',
    },
    statuses: {
      pending_inspection: 'En Attente',
      under_inspection: 'Inspection en Cours',
      verified: 'Vérifié Terrain',
      resolved: 'Résolu',
    },
    crops: {
      olive: 'Oliviers',
      date_palm: 'Palmier Dattier',
      durum_wheat: 'Blé Dur',
      citrus: 'Agrumes',
      steppe_forage: 'Fourrage Steppique',
    },
  },
};
