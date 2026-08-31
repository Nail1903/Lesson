/**
 * Starter knowledge base. Used by `prisma/seed.ts` (demo user) and by
 * `registerAction` (every new account gets a copy). Content is intentionally
 * compact but real — enough to exercise search, the graph, quizzes and RAG.
 */

export interface SeedCategory {
  slug: string;
  name: string;
  color: string;
}

export interface SeedExample {
  kind: "EVERYDAY" | "TECHNICAL" | "REAL_LIFE" | "SCIENTIFIC" | "CODE" | "MATH" | "WRONG_VS_RIGHT" | "USER";
  title?: string;
  body: string;
}

export interface SeedTerm {
  name: string;
  category: string; // category slug
  aliases?: string[];
  tags?: string[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: "NEW" | "LEARNING" | "UNDERSTOOD" | "NEEDS_REVIEW";
  confidence: number;
  importance: number;
  shortDef: string;
  longDef: string;
  inMyWords?: string;
  practicalUse?: string;
  examples?: SeedExample[];
  formulas?: { latex: string; caption?: string; explanation?: string }[];
  codeExamples?: { language: string; title?: string; code: string; explanation?: string }[];
  sources?: { kind: "BOOK" | "ARTICLE" | "PAPER" | "WEBSITE" | "VIDEO" | "COURSE" | "OTHER"; title: string; authors?: string; year?: number; url?: string; pages?: string }[];
}

export interface SeedRelation {
  from: string; // term name
  to: string; // term name
  type:
    | "SIMILAR"
    | "DIFFERENT"
    | "PART_OF"
    | "PREREQUISITE_FOR"
    | "CONTINUATION_OF"
    | "ALTERNATIVE_TO"
    | "USED_TOGETHER"
    | "CUSTOM";
  note?: string;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { slug: "suni-intellekt", name: "Süni intellekt", color: "#6d28d9" },
  { slug: "machine-learning", name: "Machine Learning", color: "#2563eb" },
  { slug: "graph-neural-networks", name: "Graph Neural Networks", color: "#0891b2" },
  { slug: "riyaziyyat", name: "Riyaziyyat", color: "#4b5563" },
  { slug: "idareetme-nezeriyyesi", name: "İdarəetmə nəzəriyyəsi", color: "#b45309" },
  { slug: "digital-twin", name: "Digital Twin", color: "#15803d" },
];

export const SEED_TERMS: SeedTerm[] = [
  {
    name: "Artificial Intelligence",
    category: "suni-intellekt",
    aliases: ["AI", "Süni intellekt"],
    tags: ["əsas anlayış"],
    difficulty: "BEGINNER",
    status: "UNDERSTOOD",
    confidence: 4,
    importance: 5,
    shortDef:
      "Kompüter sistemlərinin insan zəkasına xas olan işləri (qavrama, mühakimə, öyrənmə, qərar) yerinə yetirməsi sahəsi.",
    longDef:
      "Süni intellekt (AI) — mühitdən məlumat alan, onu emal edən və məqsədə çatmaq üçün hərəkət seçən sistemlərin qurulması ilə məşğul olan elm sahəsidir. AI simvolik (qayda əsaslı) və statistik (öyrənmə əsaslı) yanaşmaları əhatə edir. Müasir AI-nin əsas hissəsi Machine Learning, onun da alt sahəsi Deep Learning-dir.",
    inMyWords:
      "Mənim üçün AI = 'giriş → model → məqsədyönlü çıxış' konveyeri. Əsas sual: model qaydaları əl ilə yazılıb, yoxsa datadan öyrənilib?",
    practicalUse:
      "Tövsiyə sistemləri, dil modelləri, kompüter görməsi, robototexnika, sənaye optimallaşdırması, anomaliya aşkarlanması.",
    examples: [
      {
        kind: "EVERYDAY",
        title: "Telefonun klaviaturası",
        body: "Növbəti sözü təxmin edən klaviatura — sadə AI. O, sənin yazı tarixçəndən 'öyrənir' və ehtimal ən yüksək olan sözü təklif edir.",
      },
      {
        kind: "WRONG_VS_RIGHT",
        title: "AI = robot?",
        body: "Səhv: 'AI mütləq fiziki robotdur.' Düzgün: AI çox vaxt yalnız proqramdır (məs. spam filtri); fiziki bədən robototexnikanın işidir.",
      },
    ],
    sources: [
      {
        kind: "BOOK",
        title: "Artificial Intelligence: A Modern Approach",
        authors: "Stuart Russell, Peter Norvig",
        year: 2021,
        pages: "1-30",
      },
    ],
  },
  {
    name: "Machine Learning",
    category: "machine-learning",
    aliases: ["ML", "Maşın öyrənməsi"],
    tags: ["əsas anlayış"],
    difficulty: "BEGINNER",
    status: "UNDERSTOOD",
    confidence: 4,
    importance: 5,
    shortDef:
      "Alqoritmlərin açıq şəkildə proqramlaşdırılmadan, verilənlərdəki qanunauyğunluqlardan öyrənməsi.",
    longDef:
      "Machine Learning modelin parametrlərini itki funksiyasını minimuma endirəcək şəkildə optimallaşdırır. Əsas paradiqmalar: nəzarətli öyrənmə (etiketli data), nəzarətsiz öyrənmə (struktur tapmaq), gücləndirməli öyrənmə (mükafat siqnalı). Ümumiləşdirmə (generalization) — modelin görmədiyi datada yaxşı işləməsi — əsas ölçüdür; overfitting və underfitting əsas problemlərdir.",
    inMyWords:
      "ML = 'düzgün cavabları göstər, model funksiyanı özü tapsın'. Mən həmişə soruşuram: train/validation/test bölgüsü necədir?",
    practicalUse:
      "Qiymət proqnozu, təsnifat, klasterləşdirmə, sıra proqnozu, tövsiyə, anomaliya aşkarlanması.",
    formulas: [
      {
        latex: "\\theta^* = \\arg\\min_{\\theta} \\frac{1}{n}\\sum_{i=1}^{n} L(f_\\theta(x_i), y_i) + \\lambda R(\\theta)",
        caption: "Empirik risk minimizasiyası",
        explanation:
          "L — itki funksiyası, R — requlyarizasiya, λ — onun çəkisi. Model bu ifadəni minimuma endirən θ parametrlərini axtarır.",
      },
    ],
    examples: [
      {
        kind: "TECHNICAL",
        title: "Spam təsnifatı",
        body: "Giriş: e-poçt mətninin vektor təsviri. Çıxış: spam / spam deyil. Model minlərlə etiketli nümunədən sərhədi öyrənir.",
      },
    ],
  },
  {
    name: "Graph Neural Network",
    category: "graph-neural-networks",
    aliases: ["GNN"],
    tags: ["qraf", "dərin öyrənmə"],
    difficulty: "INTERMEDIATE",
    status: "LEARNING",
    confidence: 3,
    importance: 5,
    shortDef:
      "Qraf strukturlu verilənlər üzərində işləyən, qonşuluqdan mesaj ötürməklə node təmsilləri öyrənən neyron şəbəkə ailəsi.",
    longDef:
      "GNN-lər 'message passing' prinsipi ilə işləyir: hər node qonşularından gələn məlumatı aqreqasiya edir (sum/mean/max), sonra öyrənilən çevrilmədən keçirir və öz vəziyyətini yeniləyir. Bir neçə təbəqə node-un daha uzaq qonşuluğunu 'görməsinə' imkan verir. Tətbiqlər: node təsnifatı, əlaqə proqnozu (link prediction), qraf təsnifatı.",
    inMyWords:
      "GNN = 'hər node öz qonşularına qulaq asır, eşitdiyini ümumiləşdirir, özünü yeniləyir' — bunu bir neçə dəfə təkrarla.",
    practicalUse:
      "Sosial şəbəkə analizi, molekul xassələrinin proqnozu, tövsiyə qrafları, qaz/elektrik şəbəkələrində vəziyyət qiymətləndirməsi, fraud detection.",
    formulas: [
      {
        latex: "h_v^{(k)} = \\sigma\\!\\left( W^{(k)} \\cdot \\mathrm{AGG}\\big(\\{ h_u^{(k-1)} : u \\in \\mathcal{N}(v) \\cup \\{v\\} \\}\\big) \\right)",
        caption: "Ümumi message-passing yeniləməsi",
        explanation:
          "h_v^{(k)} — k-cı təbəqədə v node-unun təsviri; AGG — permutasiyaya invariant aqreqasiya; σ — qeyri-xətti funksiya.",
      },
    ],
    examples: [
      {
        kind: "REAL_LIFE",
        title: "Qazpaylayıcı şəbəkə",
        body: "Node = qovşaq/qovşaqdakı sensor, kənar = boru. GNN natamam ölçmələrdən bütün qovşaqlarda təzyiqi qiymətləndirə bilər (state estimation).",
      },
    ],
    sources: [
      {
        kind: "PAPER",
        title: "The Graph Neural Network Model",
        authors: "Scarselli et al.",
        year: 2009,
      },
    ],
  },
  {
    name: "GCN",
    category: "graph-neural-networks",
    aliases: ["Graph Convolutional Network"],
    tags: ["qraf", "transduktiv"],
    difficulty: "INTERMEDIATE",
    status: "LEARNING",
    confidence: 3,
    importance: 4,
    shortDef:
      "Qraf üzərində spektral konvolyusiyanın sadələşdirilmiş, lokal birinci dərəcəli yaxınlaşması olan GNN növü.",
    longDef:
      "Kipf & Welling (2017) GCN təbəqəsini H' = σ(D̃^{-1/2} Ã D̃^{-1/2} H W) kimi təyin edir; burada Ã = A + I (öz-ilgək əlavə edilmiş bitişiklik matrisi), D̃ — onun dərəcə matrisi. GCN bütün qrafı bir dəfəyə emal edir — bu, onu təbii olaraq transduktiv edir: yeni node əlavə olunanda normalizasiya matrisi yenidən hesablanmalıdır.",
    inMyWords:
      "GCN = 'bütün qrafı simmetrik normalizasiya ilə bir matris vurmasına yığ'. Sürətlidir, amma qraf sabit olmalıdır.",
    practicalUse:
      "Sitat şəbəkələrində məqalə mövzusunun təsnifatı, bilik qrafları, kiçik-orta ölçülü sabit qraflar.",
    formulas: [
      {
        latex: "H^{(l+1)} = \\sigma\\!\\left( \\tilde{D}^{-1/2} \\tilde{A} \\tilde{D}^{-1/2} H^{(l)} W^{(l)} \\right)",
        caption: "GCN təbəqəsi (Kipf & Welling, 2017)",
      },
    ],
    examples: [
      {
        kind: "SCIENTIFIC",
        title: "Cora dataseti",
        body: "2708 elmi məqalə node kimi, sitatlar kənar kimi. GCN yalnız 5% etiketli node ilə qalanların mövzusunu proqnozlaşdırır.",
      },
    ],
  },
  {
    name: "GraphSAGE",
    category: "graph-neural-networks",
    aliases: ["SAmple and aggreGatE", "GraphSAGE"],
    tags: ["qraf", "induktiv", "sampling"],
    difficulty: "INTERMEDIATE",
    status: "LEARNING",
    confidence: 2,
    importance: 5,
    shortDef:
      "Qonşuları nümunələyərək (sampling) və aqreqasiya funksiyaları öyrənərək induktiv node təmsilləri quran GNN çərçivəsi.",
    longDef:
      "GraphSAGE (Hamilton et al., 2017) hər node üçün bütün qonşuluğu deyil, sabit sayda təsadüfi qonşu nümunələyir və öyrənilən aqreqator (mean, LSTM, pooling) ilə birləşdirir. Vacib fərq: model bütün qrafı deyil, aqreqasiya funksiyalarını öyrənir — buna görə təlimdə görünməyən yeni node-lar üçün də (induktiv) təsvir çıxara bilir. Böyük, dəyişkən qraflarda minibatch təlimə imkan verir.",
    inMyWords:
      "GraphSAGE = 'bütün qonşulara yox, təsadüfi bir neçəsinə qulaq as; funksiyanı öyrən, qrafı yadda saxlama'. Ona görə yeni node gələndə yenidən təlim lazım deyil.",
    practicalUse:
      "Daim böyüyən sosial/əməliyyat qrafları, yeni istifadəçi/məhsul üçün soyuq başlanğıc, real-vaxt fraud detection, sənaye şəbəkələrində yeni sensor qovşaqları.",
    formulas: [
      {
        latex: "h_{\\mathcal{N}(v)}^{(k)} = \\mathrm{AGG}_k\\big(\\{ h_u^{(k-1)}, \\forall u \\in \\mathcal{S}(\\mathcal{N}(v)) \\}\\big), \\quad h_v^{(k)} = \\sigma\\!\\left( W^{(k)} \\cdot [\\, h_v^{(k-1)} \\,\\Vert\\, h_{\\mathcal{N}(v)}^{(k)} \\,] \\right)",
        caption: "GraphSAGE aqreqasiya + birləşdirmə addımı",
        explanation:
          "S(N(v)) — qonşuların nümunələnmiş alt çoxluğu; ‖ — konkatenasiya. Node öz köhnə vəziyyətini qonşu xülasəsi ilə birləşdirir.",
      },
    ],
    codeExamples: [
      {
        language: "python",
        title: "PyG ilə GraphSAGE təbəqəsi",
        code: "import torch\nfrom torch_geometric.nn import SAGEConv\n\nclass SAGE(torch.nn.Module):\n    def __init__(self, in_dim, hid, out_dim):\n        super().__init__()\n        self.c1 = SAGEConv(in_dim, hid)\n        self.c2 = SAGEConv(hid, out_dim)\n\n    def forward(self, x, edge_index):\n        x = self.c1(x, edge_index).relu()\n        return self.c2(x, edge_index)",
        explanation: "SAGEConv daxildə qonşu nümunələməsini və mean aqreqasiyanı həyata keçirir.",
      },
    ],
    sources: [
      {
        kind: "PAPER",
        title: "Inductive Representation Learning on Large Graphs",
        authors: "Hamilton, Ying, Leskovec",
        year: 2017,
        url: "https://arxiv.org/abs/1706.02216",
      },
    ],
  },
  {
    name: "Fuzzy Cognitive Map",
    category: "suni-intellekt",
    aliases: ["FCM", "Qeyri-səlis idrak xəritəsi"],
    tags: ["qraf", "modelləşdirmə", "qeyri-səlis"],
    difficulty: "INTERMEDIATE",
    status: "NEW",
    confidence: 2,
    importance: 4,
    shortDef:
      "Anlayışları node, onların səbəb-nəticə təsirlərini [-1,1] aralığında çəkili istiqamətli kənarlarla göstərən qeyri-səlis işarəli qraf.",
    longDef:
      "FCM ekspert biliyini modelləşdirmək üçün istifadə olunur. Hər node-un aktivasiya dəyəri var; sistem A(t+1) = f(W·A(t)) iterasiyası ilə sabit nöqtəyə (və ya limit tsikilə) yaxınlaşır. Çəki matrisi W ekspertlər tərəfindən və ya Hebbian tipli qaydalarla (məs. NHL — Nonlinear Hebbian Learning) öyrənilə bilər. FCM izah oluna bilən (explainable) 'nə olarsa' ssenari analizinə imkan verir.",
    inMyWords:
      "FCM = 'səbəb-nəticə oxları çəkilmiş ağıl xəritəsi, amma oxların çəkisi var və dövr edərək sabitləşir'.",
    practicalUse:
      "Siyasət/risk analizi, tibbi diaqnoz dəstəyi, sənaye proseslərinin nəzarəti, qərar dəstək sistemləri.",
    formulas: [
      {
        latex: "A_i(t+1) = f\\!\\left( A_i(t) + \\sum_{j \\ne i} w_{ji} \\, A_j(t) \\right)",
        caption: "FCM yeniləmə qaydası",
        explanation: "f — sıxıcı funksiya (məs. siqmoid); w_{ji} — j-dən i-yə təsirin qeyri-səlis çəkisi.",
      },
    ],
    examples: [
      {
        kind: "REAL_LIFE",
        title: "Su hövzəsi idarəetməsi",
        body: "Node-lar: yağıntı, əkin sahəsi, su çəkimi, çay səviyyəsi. Ekspert oxları çəkir; FCM quraqlıq ssenarisində çay səviyyəsinin necə düşəcəyini simulyasiya edir.",
      },
    ],
  },
  {
    name: "Hebbian Learning",
    category: "riyaziyyat",
    aliases: ["Hebb qaydası"],
    tags: ["öyrənmə qaydası", "neyron"],
    difficulty: "INTERMEDIATE",
    status: "NEW",
    confidence: 2,
    importance: 3,
    shortDef:
      "'Birlikdə alışan neyronlar birlikdə bağlanır' — eyni vaxtda aktiv olan iki vahid arasındakı əlaqənin gücləndiyi lokal öyrənmə qaydası.",
    longDef:
      "Klassik forma: Δw_{ij} = η · x_i · x_j. Requlyarizasiyasız bu qayda qeyri-stabildir (çəkilər hüdudsuz böyüyür), ona görə Oja qaydası kimi normalizasiya əlavələri istifadə olunur. Hebbian öyrənmə nəzarətsizdir və FCM çəkilərinin avtomatik tənzimlənməsində (NHL) tətbiq olunur.",
    inMyWords:
      "Hebbian = 'birlikdə işləyəni möhkəmləndir'. Amma tормоз olmasa partlayır — ona görə Oja normalizasiyası.",
    practicalUse:
      "Assosiativ yaddaş modelləri, FCM çəki öyrənməsi (NHL/AHL), bioloji cəhətdən inandırıcı öyrənmə tədqiqatları.",
    formulas: [
      { latex: "\\Delta w_{ij} = \\eta \\, x_i \\, x_j", caption: "Sadə Hebb qaydası" },
      {
        latex: "\\Delta w_{ij} = \\eta \\, y_j \\,(x_i - y_j \\, w_{ij})",
        caption: "Oja qaydası (normalizasiya ilə)",
      },
    ],
  },
  {
    name: "State Estimation",
    category: "idareetme-nezeriyyesi",
    aliases: ["Vəziyyət qiymətləndirməsi"],
    tags: ["nəzarət", "filtr"],
    difficulty: "ADVANCED",
    status: "LEARNING",
    confidence: 3,
    importance: 4,
    shortDef:
      "Səs-küylü və natamam ölçmələrdən sistemin daxili vəziyyət dəyişənlərini (bilavasitə ölçülməyən) qiymətləndirmə prosesi.",
    longDef:
      "Xətti-Qauss halda optimal həll Kalman filtridir: proqnoz addımı model əsasında vəziyyəti irəli aparır, yeniləmə addımı yeni ölçmə ilə düzəliş edir. Qeyri-xətti sistemlərdə EKF/UKF və ya hissəcik filtrləri istifadə olunur. Enerji/qaz şəbəkələrində state estimation SCADA ölçmələrindən şəbəkənin tam iş rejimini bərpa edir və Digital Twin üçün əsasdır.",
    inMyWords:
      "State estimation = 'gördüyüm az, amma modeli bilirəm → görünməyəni ağıllı təxmin et'. Kalman = proqnoz + ölçmə ilə düzəliş.",
    practicalUse:
      "Naviqasiya (GPS+IMU), robototexnika, elektrik/qaz şəbəkələrinin monitorinqi, Digital Twin-in real vaxtda kalibrlənməsi.",
    formulas: [
      {
        latex: "\\hat{x}_{k|k} = \\hat{x}_{k|k-1} + K_k \\,(z_k - H \\hat{x}_{k|k-1})",
        caption: "Kalman yeniləmə addımı",
        explanation: "K_k — Kalman gücləndiricisi; z_k − H x̂ — innovasiya (ölçmə ilə proqnoz arasındakı fərq).",
      },
    ],
  },
  {
    name: "Model Predictive Control",
    category: "idareetme-nezeriyyesi",
    aliases: ["MPC", "Recessing Horizon Control"],
    tags: ["nəzarət", "optimallaşdırma"],
    difficulty: "ADVANCED",
    status: "LEARNING",
    confidence: 3,
    importance: 5,
    shortDef:
      "Hər addımda sistemin modelindən istifadə edərək gələcək davranışı proqnozlaşdıran və məhdudiyyətli optimallaşdırma həll edərək nəzarət siqnalı seçən idarəetmə metodu.",
    longDef:
      "MPC sonlu üfüqdə (prediction horizon) məqsəd funksiyasını (məs. arzuolunan trayektoriyadan kənarlaşma + idarə səyi) minimuma endirir, giriş/çıxış məhdudiyyətlərini nəzərə alır, tapılmış ardıcıllığın yalnız ilk addımını tətbiq edir, sonra yeni ölçmə ilə bütün prosesi təkrarlayır (receding horizon). Modelin dəqiqliyi kritikdir — buna görə state estimation və Digital Twin ilə sıx işləyir.",
    inMyWords:
      "MPC = 'irəlini modelə görə hesabla, ən yaxşı planı tap, yalnız ilk addımı at, sonra yenidən planlaşdır'. Şahmatда bir neçə gediş irəli düşünüb yalnız birini oynamaq kimi.",
    practicalUse:
      "Proses sənayesi (neft-kimya), avtomobil (adaptiv kruiz), enerji sistemləri, qazpaylayıcı şəbəkədə təzyiq/axının idarə edilməsi, HVAC.",
    formulas: [
      {
        latex: "\\min_{u_0,\\dots,u_{N-1}} \\sum_{k=0}^{N-1} \\big( \\lVert x_k - x_k^{\\text{ref}} \\rVert_Q^2 + \\lVert u_k \\rVert_R^2 \\big) \\;\\; \\text{s.t.} \\;\\; x_{k+1}=f(x_k,u_k),\\; u_k \\in \\mathcal{U},\\; x_k \\in \\mathcal{X}",
        caption: "MPC optimallaşdırma məsələsi",
      },
    ],
    examples: [
      {
        kind: "WRONG_VS_RIGHT",
        title: "MPC vs PID",
        body: "PID keçmiş xətaya reaksiya verir və məhdudiyyətləri bilmir. MPC gələcəyi proqnozlaşdırır və məhdudiyyətləri (məs. klapan 100%-dən çox açıla bilməz) birbaşa optimallaşdırmaya daxil edir.",
      },
    ],
  },
  {
    name: "Digital Twin",
    category: "digital-twin",
    aliases: ["Rəqəmsal əkiz"],
    tags: ["simulyasiya", "IoT"],
    difficulty: "INTERMEDIATE",
    status: "LEARNING",
    confidence: 3,
    importance: 5,
    shortDef:
      "Fiziki sistemin real-vaxt data ilə daim yenilənən, proqnoz və 'nə olarsa' analizi üçün istifadə olunan dinamik rəqəmsal modeli.",
    longDef:
      "Digital Twin üç hissədən ibarətdir: fiziki obyekt, virtual model və onları bağlayan iki-istiqamətli data axını. Sensor məlumatı state estimation vasitəsilə modeli kalibrləyir; model isə proqnoz, optimallaşdırma (çox vaxt MPC) və nasazlıq aşkarlaması üçün istifadə olunur. Sadə 3D vizualizasiyadan fərqi — modelin fizikanı əks etdirməsi və geri-əlaqə ilə yenilənməsidir.",
    inMyWords:
      "Digital Twin = 'canlı simulyasiya' — real qurğu ilə sinxron işləyən, ondan öyrənən və ona məsləhət verən model.",
    practicalUse:
      "Qazpaylayıcı/su şəbəkələri, külək turbinləri, istehsalat xətləri, şəhər infrastrukturu, prediktiv texniki xidmət.",
    examples: [
      {
        kind: "REAL_LIFE",
        title: "Qazpaylayıcı şəbəkənin əkizi",
        body: "Boru şəbəkəsinin hidravlik modeli SCADA ölçmələri ilə hər dəqiqə kalibrlənir; operator klapan bağlamazdan əvvəl əkizdə nəticəni yoxlayır.",
      },
    ],
  },
  {
    name: "Information Constraints",
    category: "riyaziyyat",
    aliases: ["İnformasiya məhdudiyyətləri"],
    tags: ["nəzəriyyə", "paylanmış sistemlər"],
    difficulty: "ADVANCED",
    status: "NEW",
    confidence: 1,
    importance: 3,
    shortDef:
      "Bir qərarvericinin və ya nəzarətçinin yalnız məhdud, lokal və ya gecikmiş məlumatla qərar verməli olması şərtləri.",
    longDef:
      "Paylanmış idarəetmə və qraf əsaslı öyrənmədə hər agent adətən yalnız öz qonşuluğunu 'görür'. İnformasiya məhdudiyyətləri optimal qlobal həllin əlçatan olub-olmadığını, hansı struktur (məs. quadratic invariance) altında məsələnin qabarıq qaldığını müəyyən edir. GNN-lərdə bu, K təbəqənin yalnız K-addımlıq qonşuluğu birləşdirə bilməsi ilə üzə çıxır.",
    inMyWords:
      "Information constraints = 'kim nəyi nə vaxt bilir?' sualı. Qərarın keyfiyyəti mövcud məlumatın strukturu ilə məhdudlaşır.",
    practicalUse:
      "Paylanmış nəzarətçi dizaynı, çoxagentli sistemlər, sensor şəbəkələri, federativ öyrənmə, GNN dərinliyinin seçimi.",
  },
];

export const SEED_RELATIONS: SeedRelation[] = [
  { from: "Machine Learning", to: "Artificial Intelligence", type: "PART_OF", note: "ML — AI-nin alt sahəsidir." },
  { from: "Graph Neural Network", to: "Machine Learning", type: "PART_OF" },
  { from: "GCN", to: "Graph Neural Network", type: "PART_OF" },
  { from: "GraphSAGE", to: "Graph Neural Network", type: "PART_OF" },
  { from: "GraphSAGE", to: "GCN", type: "ALTERNATIVE_TO", note: "GraphSAGE induktiv + sampling; GCN transduktiv + tam qraf." },
  { from: "GraphSAGE", to: "GCN", type: "SIMILAR", note: "Hər ikisi message-passing GNN-dir." },
  { from: "Machine Learning", to: "Graph Neural Network", type: "PREREQUISITE_FOR" },
  { from: "Hebbian Learning", to: "Fuzzy Cognitive Map", type: "PREREQUISITE_FOR", note: "NHL FCM çəkilərini Hebbian qayda ilə öyrədir." },
  { from: "Fuzzy Cognitive Map", to: "Graph Neural Network", type: "SIMILAR", note: "Hər ikisi çəkili istiqamətli qraf üzərində iterativ yeniləmədir." },
  { from: "State Estimation", to: "Digital Twin", type: "PART_OF", note: "State estimation əkizin kalibrlənmə mexanizmidir." },
  { from: "State Estimation", to: "Model Predictive Control", type: "USED_TOGETHER", note: "MPC dəqiq vəziyyət tələb edir." },
  { from: "Model Predictive Control", to: "Digital Twin", type: "USED_TOGETHER" },
  { from: "Digital Twin", to: "Graph Neural Network", type: "USED_TOGETHER", note: "Şəbəkə əkizlərində GNN state estimation üçün istifadə oluna bilər." },
  { from: "Information Constraints", to: "Graph Neural Network", type: "CONTINUATION_OF", note: "GNN dərinliyi = əlçatan məlumat üfüqü." },
  { from: "Information Constraints", to: "Model Predictive Control", type: "USED_TOGETHER", note: "Paylanmış MPC-də hər nəzarətçi lokal məlumatla işləyir." },
];

export interface SeedTopic {
  slug: string;
  name: string;
  description?: string;
  /** term names, in lesson order */
  terms: string[];
}

export interface SeedSubject {
  slug: string;
  name: string;
  color: string;
  description?: string;
  topics: SeedTopic[];
}

/**
 * Academic structure. Note how the same term (e.g. "GraphSAGE", "State Estimation")
 * appears under more than one subject/topic — it still resolves to the single
 * canonical /terms/[slug] page.
 */
export const SEED_SUBJECTS: SeedSubject[] = [
  {
    slug: "graph-representation-learning",
    name: "Graph Representation Learning",
    color: "#0891b2",
    description: "Qraf strukturlu verilənlər üzərində maşın öyrənməsi.",
    topics: [
      {
        slug: "giris-ve-esaslar",
        name: "1. Giriş və əsaslar",
        description: "Qraflar, message passing, transduktiv vs induktiv.",
        terms: ["Artificial Intelligence", "Machine Learning", "Graph Neural Network"],
      },
      {
        slug: "gcn-ve-spektral-baxis",
        name: "2. GCN və spektral baxış",
        terms: ["GCN", "Graph Neural Network"],
      },
      {
        slug: "induktiv-ve-sampling",
        name: "3. İnduktiv öyrənmə və sampling",
        description: "GraphSAGE, minibatch təlim, yeni node-lar.",
        terms: ["GraphSAGE", "GCN", "Information Constraints"],
      },
      {
        slug: "qraf-esasli-idrak-modelleri",
        name: "4. Qraf əsaslı idrak modelləri",
        terms: ["Fuzzy Cognitive Map", "Hebbian Learning"],
      },
    ],
  },
  {
    slug: "cyber-physical-sistemler",
    name: "Kiber-fiziki sistemlər və Digital Twin",
    color: "#15803d",
    description: "Sensor, model və idarəetmənin qovuşduğu sistemlər.",
    topics: [
      {
        slug: "vezijjet-qiymetlendirmesi",
        name: "1. Vəziyyət qiymətləndirməsi",
        terms: ["State Estimation", "Information Constraints"],
      },
      {
        slug: "proqnozlu-idareetme",
        name: "2. Proqnozlu idarəetmə (MPC)",
        terms: ["Model Predictive Control", "State Estimation"],
      },
      {
        slug: "digital-twin-arxitekturasi",
        name: "3. Digital Twin arxitekturası",
        terms: ["Digital Twin", "State Estimation", "Model Predictive Control", "Graph Neural Network"],
      },
    ],
  },
];

export interface SeedQuestion {
  term: string;
  type: "OPEN" | "MCQ" | "TRUE_FALSE";
  prompt: string;
  choices?: string[];
  correctAnswer: string;
  explanation: string;
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    term: "GraphSAGE",
    type: "OPEN",
    prompt: "GraphSAGE-i induktiv edən əsas dizayn qərarı nədir?",
    correctAnswer:
      "Model qrafın özünü deyil, aqreqasiya funksiyalarını öyrənir və qonşuları nümunələyir; buna görə təlimdə görünməyən yeni node-lar üçün də təsvir çıxara bilir.",
    explanation:
      "GCN bütün qrafın normalizasiya matrisindən asılıdır (transduktiv). GraphSAGE öyrənilən AGG funksiyaları + sabit ölçülü qonşu sampling sayəsində yeni node-a ümumiləşir.",
  },
  {
    term: "GraphSAGE",
    type: "MCQ",
    prompt: "Aşağıdakılardan hansı GraphSAGE ilə GCN arasındakı DÜZGÜN fərqdir?",
    choices: [
      "GCN induktiv, GraphSAGE transduktivdir",
      "GraphSAGE qonşuları nümunələyir, GCN bütün qonşuluğu istifadə edir",
      "GCN mesaj ötürmür, GraphSAGE ötürür",
      "GraphSAGE yalnız yönsəz qraflarda işləyir",
    ],
    correctAnswer: "GraphSAGE qonşuları nümunələyir, GCN bütün qonşuluğu istifadə edir",
    explanation: "Sampling GraphSAGE-ə böyük və dəyişkən qraflarda minibatch təlim imkanı verir.",
  },
  {
    term: "Model Predictive Control",
    type: "TRUE_FALSE",
    prompt: "MPC hər addımda hesabladığı bütün idarə ardıcıllığını tətbiq edir.",
    choices: ["Doğru", "Yanlış"],
    correctAnswer: "Yanlış",
    explanation:
      "MPC yalnız ilk addımı tətbiq edir, sonra yeni ölçmə ilə optimallaşdırmanı təkrarlayır (receding horizon).",
  },
  {
    term: "State Estimation",
    type: "OPEN",
    prompt: "Kalman filtrində innovasiya termini nəyi ifadə edir?",
    correctAnswer: "Yeni ölçmə ilə model proqnozu arasındakı fərqi: z_k − H·x̂_{k|k-1}.",
    explanation: "Kalman gücləndiricisi bu fərqi çəkiləyərək vəziyyət qiymətini düzəldir.",
  },
  {
    term: "Digital Twin",
    type: "TRUE_FALSE",
    prompt: "Digital Twin sadəcə fiziki obyektin 3D vizualizasiyasıdır.",
    choices: ["Doğru", "Yanlış"],
    correctAnswer: "Yanlış",
    explanation:
      "Digital Twin fizikanı əks etdirən və real-vaxt data ilə iki-istiqamətli əlaqədə yenilənən dinamik modeldir; vizualizasiya yalnız bir hissədir.",
  },
];
