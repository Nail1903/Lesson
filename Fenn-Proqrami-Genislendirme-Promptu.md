Mövcud tətbiq: https://lesson-nine-ashy.vercel.app/dashboard

Bu layihəni universitet müəlliminin fənn proqramlarını, sillabuslarını, dərs hazırlığını, terminlərini və şəxsi öyrənmə məşqlərini idarə etdiyi iş məkanına çevir. Aşağıdakı funksiyaları mövcud layihəyə inteqrasiya et.

Bu sənəd məhsul tələbləridir; dashboard-un hazırkı menyuları, kod bazası və texnoloji arxitekturası təsdiqlənməyib. Əvvəlcə repozitoriyanı və işlək interfeysi yoxla. Mövcud funksiyaları inventarlaşdır, tələblərlə tutuşdur, hazır olanları genişləndir. Mövcud dizayn dilini, autentifikasiyanı, verilənlər bazasını və uyğun komponentləri əsas götür. Dəyişiklikləri real məlumat saxlanması ilə tamamla; yalnız interfeys maketi hazırlamaqla kifayətlənmə.

1. ƏSAS MƏHSUL MƏNTİQİ

Əsas istifadəçi müəllimdir. Mən müxtəlif universitetlərdə, müxtəlif semestrlərdə və bir neçə qrupda dərs deyə bilərəm.

Üç anlayışı ayır:
- Fənn: təkrar istifadə olunan əsas məzmun və onun versiyaları.
- Fənnin semestr üzrə tədrisi: universitet, tədris ili, semestr, müəllim, tədris dili və istifadə olunan proqram versiyası.
- Qrup üzrə dərs gedişi: dərs tarixləri, keçirilən hissələr, gecikmələr və qrup qeydləri.

Eyni fənn bir neçə universitetdə tədris edilə, bir semestr tədrisinə bir neçə qrup bağlana bilməlidir. Universitetə xas məzmun variantları dəstəklənsin. Qrupların təqvimi və irəliləyişi ayrıca saxlanılsın.

Dərsin məzmun səhifəsi ilə onun konkret tarixdə keçirilməsini də ayır. Bir mövzu bir neçə görüşdə keçirilə, bir görüş bir neçə mövzunu əhatə edə bilər.

2. FƏNN YARATMA VƏ FƏNN KARTI

İlkin fənn qaralamasını yalnız adla yaratmaq mümkün olsun. Qalan məlumatları sonradan tamamlaya bilim.

Dəstəklənən məlumatlar:
- Fənnin adı və kodu, universitet, fakültə, kafedra, ixtisas.
- Təhsil pilləsi, kurs, tədris ili, semestr, tədris dili və formatı.
- Qruplar, tələbə sayı, müəllim, əlaqə məlumatları və konsultasiya saatları.
- Kredit, mühazirə, seminar, laboratoriya, praktika və sərbəst iş saatları.
- İlkin bilik tələbləri, əlaqəli fənlər, qısa təsvir və ümumi məqsəd.
- Proqramın versiyası, sənəd statusu və istifadəçinin daxil etdiyi təsdiq məlumatları.

Universitet, qrup və semestr məlumatlarını ayrıca idarə olunan siyahılardan seçmək, çatışmayanını həmin yerdə əlavə etmək mümkün olsun.

Fənn siyahısında universitet, semestr, dil və status üzrə filtr; axtarış; kart və cədvəl görünüşü olsun. Kartda planlaşdırılan dərslər, hazırlanmış dərslər və qrup üzrə keçirilmiş dərslər ayrı göstərilsin.

3. FƏNNİN AYRICA SƏHİFƏSİ

Fənn səhifəsində bu bölmələr olsun:
Ümumi baxış, Fənn proqramı, Sillabus, Dərslər, Təqvim və qruplar, Terminlər, Mənbələr, Tapşırıqlar və sual bankı, Qeydlər, İxrac və tarixçə.

Ümumi baxışda tamamlanmamış hazırlıq işləri, növbəti dərslər və məzmun boşluqları görünsün. “Qiymətləndirmə ilə əlaqələndirilməmiş 2 öyrənmə nəticəsi var” kimi konkret bildirişlər verilsin.

Fənn proqramı əsas akademik məzmunu, sillabus isə seçilmiş universitet və semestrdə tətbiq edilən planı əks etdirsin. Universitet şablonuna görə bölmələri dəyişmək mümkün olsun.

4. PROQRAM VƏ SİLLABUS REDAKTORU

Redaktə edilən bölmələr:
- Fənnin təsviri, məqsədi və ölçülə bilən öyrənmə nəticələri.
- Mövzular, ardıcıllıq və saat bölgüsü.
- Tədris metodları və müstəqil iş.
- Qiymətləndirmə komponentləri, çəkiləri, meyarları və müddətləri.
- Davamiyyət, gecikmiş tapşırıq, akademik dürüstlük və AI istifadəsi qaydaları.
- Əsas və əlavə ədəbiyyat, proqram təminatı və avadanlıq tələbləri.
- Universitetin tələb etdiyi əlavə bölmələr.

Müəllim bölmə əlavə edə, adını dəyişə, sırasını dəyişə və şablonun qaydalarına uyğun gizlədə bilsin. Tələb olunan bölmə çatışmadıqda səbəbi göstərən xəbərdarlıq verilsin.

Saat cəmləri və qiymətləndirmə çəkiləri avtomatik yoxlanılsın. Akademik saatın dəqiqəsi universitetə görə tənzimlənsin. Dərs sayı, akademik saat və real dəqiqə ayrı vahidlər olsun. Kredit–yük münasibətini universal sabit rəqəm kimi qəbul etmə.

5. DƏRSLƏRİN YARADILMASI

Dərsləri tək-tək, toplu ad siyahısından və əvvəlki fənndən seçərək əlavə etmək mümkün olsun. Say daxil edərək, məsələn, 15 boş dərs qaralaması yarada bilim.

Hər dərsin ayrıca URL-i olsun. Dərslər modul və həftələrə bölünsün, sıralansın, köçürülsün, çoxaldılsın və arxivləşdirilsin.

Dərs məlumatları: sıra nömrəsi, ad, qısa təsvir, növ, müddət, aid olduğu modul, ilkin biliklər və hazırlıq statusu.

Hazırlıq statusları: qaralama, hazırlanır, hazırdır, yenilənməlidir. Keçirilmə statusunu konkret qrup və görüş səviyyəsində saxla.

6. DƏRSİN İŞ SƏHİFƏSİ

Hər dərs səhifəsində birbaşa məlumat əlavə etmək və redaktə etmək mümkün olsun:
- Ümumi məqsəd: dərsin nə üçün keçirildiyi.
- Öyrənmə hədəfləri: dərsdə diqqət yetiriləcək konkret məsələlər.
- Öyrənmə nəticələri: tələbənin dərsin sonunda nümayiş etdirəcəyi bacarıqlar.
- İlkin biliklər və dərsöncəsi hazırlıq.
- Müəllimin izah qeydləri və danışıq planı.
- Dərsin mərhələləri və hər mərhələyə ayrılan vaxt.
- Öyrənmə materialları: mətn, nümunə, kod, şəkil, video, təqdimat və digər fayllar.
- Terminlər, praktiki tapşırıqlar, yoxlama sualları və ev tapşırığı.
- Mənbələr və səhifə göstəriciləri.
- Tez-tez qarışdırılan anlayışlar və gözlənilən tələbə sualları.
- Dərsdən sonrakı refleksiya və növbəti dərsə keçid qeydi.

Öyrənmə nəticələri “izah edir”, “müqayisə edir”, “hesablayır”, “tətbiq edir” kimi müşahidə edilə bilən hərəkətlərlə yazılsın. İstəyə görə Bloom səviyyəsi və nailiyyət meyarı əlavə edilsin.

Fənn nəticəsi → dərs nəticəsi → fəaliyyət → qiymətləndirmə əlaqəsi qurulsun. Əlaqələndirmə cədvəli məzmunun əhatəsini göstərsin; bu göstərici tələbənin faktiki biliyi kimi təqdim edilməsin.

Redaktor başlıq, cədvəl, siyahı, kod bloku, LaTeX düsturu, keçid və faylları dəstəkləsin. Hər bölmədə görünən “Əlavə et” və “Redaktə et” əməliyyatları olsun.

7. TERMİN BAZASI

Vahid termin bazası yarat və mövcud termin modulu varsa onu genişləndir. Termin fənnlərə və dərslərə əlaqə ilə əlavə edilsin. Eyni anlayışı müxtəlif dərslər üçün təkrar yaratmağa məcbur olmayım.

Termin sahələri:
İngiliscə kanonik ad, Azərbaycan dilində qarşılıq, sinonimlər, qısa izah, akademik izah, nümunə, əks nümunə, istifadə sahəsi, düstur və ya kod, əlaqəli terminlər, qarışdırılan anlayışlar, çətinlik, etiketlər və mənbələr.

Dərsə termin əlavə edərkən mövcud bazadan seçmək, yenisini yaratmaq və çoxsaylı termin əlavə etmək mümkün olsun.

Ümumi termin izahı ilə dərsə xas izahı ayır. Bir dərsin sadələşdirilmiş izahı başqa dərslərin mətnini dəyişməsin. Eyni yazılışlı, fərqli mənalı anlayışları avtomatik birləşdirmə.

Terminlər üçün axtarış, filtr, seçilənlərin ixracı və yoxlanılan JSON idxalı olsun. Mövcud idxal sahələri və identifikatorları ilə uyğunluğu qoru.

8. MÜƏLLİM ÜÇÜN TERMİN MƏŞQLƏRİ

Məşqlər ilk mərhələdə mənim şəxsi hazırlığım üçün işləsin; tələbə hesabı tələb etməsin.

Dəstəklə:
- Termin–izah kartları və əks istiqamətdə təkrar.
- Çoxvariantlı suallar, uyğunlaşdırma, boşluq doldurma.
- Qısa cavab, anlayışları müqayisə etmə və situasiya üzrə termin seçimi.
- Kod və ya riyazi nümunədə anlayışın tanınması.
- “Bu anlayışı tələbəyə sadə dildə izah et” məşqi.

Məşqi dərs, fənn, termin seçimi, çətinlik, sual sayı və vaxt üzrə başlada bilim. Qarışdırdığım və təkrar vaxtı çatmış terminlər üçün ayrıca rejim olsun.

Cəhdlər, cavablar, ipucları, vaxt, düzgünlük və növbəti təkrar tarixi saxlanılsın. İpuclu cavablar ayrıca qeyd edilsin. Təkrar planlaşdırmasının qaydası aydın və tənzimlənə bilən olsun.

Qısa cavabı yalnız sözlərin eyniliyinə görə səhv sayma. Cavab açarı və alternativlər nəzərə alınsın. AI qiymətləndirməsi istifadə olunarsa səbəb göstərilsin və müəllim nəticəni düzəldə bilsin.

“Bilirəm” kimi özünüqiymətləndirmə ilə obyektiv test nəticəsini ayrı göstər. İnkişafı istifadəçi və anlayışın konteksti üzrə saxla; fərqli mənalı terminlərin nəticələrini qarışdırma.

9. MƏNBƏ VƏ MATERİAL İDARƏETMƏSİ

Kitab, məqalə, sayt, video, standart, dataset, kod deposu və yüklənmiş fayl əlavə edə bilim.

Mənbə sahələri: başlıq, müəllif, il, nəşr, nəşriyyat, DOI, URL, dil, növ və şəxsi qeyd. Mənbənin konkret dərs və terminlə əlaqəsində fəsil, səhifə və video vaxtı ayrıca saxlanılsın.

Məsələn, eyni kitab bir dərsdə 20–28-ci, başqa dərsdə 65–70-ci səhifələrlə əlaqələndirilə bilsin.

Əsas/əlavə, tələbəyə tövsiyə/müəllim hazırlığı və oxunub/oxunmayıb işarələri olsun. Metadata avtomatik doldurularsa yoxlama imkanı verilsin; tapılmayan müəllif, il, DOI və səhifə uydurulmasın.

10. SUAL BANKI VƏ QİYMƏTLƏNDİRMƏ

Suallar və tapşırıqlar dərsə, terminə və öyrənmə nəticəsinə bağlansın. Növ, çətinlik, bal, təxmini müddət, düzgün cavab, izah və qiymətləndirmə meyarı saxlanılsın.

Test, açıq sual, kod tapşırığı, hesablama, esse, situasiya təhlili və layihə formatları dəstəklənsin.

Asan/orta/çətin bölgüsü, mövzu əhatəsi və ümumi bal üzrə yoxlama işi və bilet hazırlamaq mümkün olsun. Nümunə konfiqurasiya: 2 asan, 2 orta, 1 çətin sual.

Tapşırığın müəllim variantında cavab və qiymətləndirmə meyarları, tələbə variantında yalnız paylaşılacaq məzmun olsun.

11. MÜƏLLİMİN GÜNDƏLİK İŞİNİ ASANLAŞDIRAN FUNKSİYALAR

Dashboard-da bugünkü və növbəti dərslər, hazırlıq tələb edən mövzular, yarımçıq qeydlər və təkrar ediləcək terminlər görünsün.

Hər qrup üçün “Harada qaldım?” qeydi, son keçilən mövzu, tamamlanmayan tapşırıq və növbəti addım saxlanılsın. Məzmunu dəyişmək bütün qrupların irəliləyişini dəyişməsin.

Təqvimdə dərs tarixləri, auditoriya/online keçid, istisna günlər və təxirəsalma olsun. Tarixlər dəyişdiriləndə təsir göstərilsin və planın tətbiqi müəllim seçimi ilə baş versin.

“Dərsi apar” rejimi cari mərhələni, taymeri, izah qeydlərini, nümunələri və növbəti fəaliyyəti rahat göstərsin.

Dərsdən sonra qısa refleksiya forması olsun: nə yaxşı alındı, nə çətin oldu, hansı suallar yarandı, növbəti dəfə nə dəyişməlidir. Bu qeydlər yeni semestr planında nəzərə çarpsın.

12. SEMESTRƏ KÖÇÜRMƏ, VERSİYALAR VƏ ŞABLONLAR

Fənni növbəti semestr üçün istifadə edərkən universitet, qruplar və tarixlər dəyişdirilə bilsin. Hansı material və qeydlərin köçürüləcəyini seçim.

Keçmiş semestrin keçirilmə statusları, məşq cəhdləri və qrup qeydləri yeni semestrdə avtomatik tamamlanmış məlumat kimi görünməsin.

Dərc edilən proqram və sillabus konkret məzmun versiyasına bağlansın. Sonrakı redaktə əvvəlki sənədi səssiz dəyişməsin. Versiyaları müqayisə etmək və əvvəlki məzmundan yeni qaralama yaratmaq mümkün olsun.

Universitetə, dilə, fənn növünə və dərs formatına görə şəxsi şablonlar saxlanılsın. Mühazirə, seminar və laboratoriya üçün fərqli dərs şablonları seçilə bilsin.

13. İDXAL VƏ İXRAC

Mövcud Word/PDF proqramını yükləyib bölmələri, mövzuları, saatları və mənbələri uyğun sahələrə yerləşdirmək mümkün olsun. İdxaldan əvvəl çıxarılan məlumatı və uyğunlaşdırmanı redaktə edə bilim. Şəkil əsaslı PDF-də mətn tanınması tələbini və qeyri-müəyyən hissələri göstər.

Excel/CSV-dən mövzu və dərs siyahısı, JSON-dan terminlər idxal edilsin. Təkrar idxal dublikatları səssiz yaratmasın; uyğunlaşdırma qaydası və sətir xətaları görünsün.

İxraclar: fənn proqramı və sillabus üçün redaktə edilə bilən DOCX və PDF; dərs planı; termin siyahısı; cavablı/cavabsız tapşırıq variantı; müəllim və tələbə material paketləri.

İxrac universitet şablonunun bölmə sırasını, cədvəllərini, başlıq və səhifələnməsini nəzərə alsın. Məzmunu, şəkilləri və düsturları səssiz ixtisar etmə. Yoxlanmayan nəticəni “universitet tərəfindən təsdiqlənib” kimi təqdim etmə.

14. AI KÖMƏKÇİSİ

AI funksiyalarını uyğun səhifədə ayrıca əməliyyatlar kimi yerləşdir:
- Məqsəddən ölçülə bilən öyrənmə nəticələri təklif et.
- Mövzunu seçilən müddətə görə dərs planına böl.
- Yüklədiyim mənbədən termin və sual qaralamaları çıxar.
- Sadə və daha dərin izah, praktiki nümunə və situasiya tapşırığı hazırla.
- Mövzuların ardıcıllığında ilkin bilik boşluqlarını göstər.
- Nəticə–fəaliyyət–qiymətləndirmə uyğunsuzluqlarını təklif kimi işarələ.
- Dərsin sonunda sürətli yoxlama sualları və müəllim hazırlığı məşqi yarat.

AI seçilən fənnin dilini, tələbə səviyyəsini, dərs müddətini və mənbələrini nəzərə alsın. Mənbəyə əsaslanan hissələri həmin mənbəyə bağlasın; yaradılmış nümunələri ayrıca işarələsin.

AI nəticəsi əvvəlcə qaralama olsun. Mövcud mətnə dəyişiklik təklif ediləndə əvvəlki/yeni mətn göstərilsin və hissə-hissə qəbul etmək mümkün olsun. Mənbə uydurulmasın, əsas mətn müəllimin seçimi olmadan əvəz edilməsin.

AI xidməti qoşulmayıbsa bunu aydın göstər və manual əməliyyatları işlək saxla. İstifadə və xərc limitləri konfiqurasiya edilə bilsin.

15. İNTERFEYS, MƏLUMAT VƏ GİRİŞ QAYDALARI

Azərbaycan dili əsas interfeys dili olsun. Məzmun dili fənn üzrə ayrıca seçilsin. Minimalist, oxunaqlı, masaüstündə rahat və mobil ölçüyə uyğun interfeys qur.

Universal axtarış, klaviatura ilə idarəetmə, son açılan səhifələr, seçilmişlər, sürətli qeyd, toplu əməliyyatlar və rahat geri naviqasiya olsun.

Avtomatik yaddaşın vəziyyəti görünsün. Bağlantı kəsiləndə saxlanmamış mətn itməsin. İki pəncərədə ziddiyyətli redaktə zamanı son yazanın əvvəlkini səssiz silməsinin qarşısını al. Arxivləşdirmə və bərpa dəstəklənsin.

Müəllimin şəxsi qeydləri, refleksiyası və cavab açarları yalnız müvafiq girişlə açılsın. Tələbə görünüşü və ixracları server tərəfində süzülsün; gizli məlumatı səhifəyə göndərib yalnız CSS ilə gizlətmə.

Mövcud istifadəçilərin məlumatlarını təcrid et, bütün resurslarda server səviyyəsində giriş yoxlaması apar. Mövcud məlumatları qoruyan migrasiyalar hazırla. Statistikalar real saxlanmış məlumatdan hesablansın; olmayan irəliləyiş faizi göstərmə.

16. REALLAŞDIRMA ARDICILLIĞI

Mərhələ 1: mövcud layihənin auditi, fənn və semestr/qrup modeli, ayrıca fənn/dərs səhifələri, proqram/sillabus redaktoru, termin–mənbə əlaqələri və real yaddaş.

Mərhələ 2: müəllim məşqləri, təkrar planı, sual bankı, idxal/ixrac, versiyalar və semestrə köçürmə.

Mərhələ 3: gündəlik dashboard, təqvim, dərsi aparma rejimi, refleksiya və AI köməkçisi.

Tələbə hesabları, davamiyyət jurnalı, tələbə qiymətləri, ortaq müəlliflik və digər sistemlərlə inteqrasiyalar sonrakı genişlənmə kimi ayrıca saxlanılsın. Əsas müəllim iş axını bunlardan asılı olmasın.

Bu promptun əsas əhatəsi ilk üç mərhələdir. Ardıcıl həyata keçir, hər mərhələdə işlək nəticə saxla. Giriş və ya xarici xidmət çatışmırsa konkret məhdudiyyəti bildir və mümkün olan hissələri tamamla.

17. QƏBUL MEYARLARI

İş bu ssenarilərlə yoxlanmalıdır:
1) Fənn yaradılır, səhifə yenilənəndən sonra məlumatlar qalır; ona semestr və iki qrup bağlanır.
2) İki qrupun dərs tarixləri və irəliləyişi müstəqil dəyişir.
3) Dərsin məqsədi, nəticələri, materialları, termini və mənbəsi öz səhifəsində əlavə və redaktə edilir.
4) Bir termin iki dərsə bağlanır; bir dərsin xüsusi izahı digərini dəyişmir.
5) Müəllim məşqi tamamlanır; cəhd və növbəti təkrar tarixi saxlanır.
6) Yeni semestr əvvəlki məzmundan yaradılır, köhnə qrupun gedişi yeni semestrə keçmir.
7) Saat və qiymətləndirmə cəmlərində səhv göstərilir; ilkin bilik və nəticə əlaqələri yoxlanılır.
8) İdxal önizləməsi düzəldilir və təkrar idxal dublikat yaratmadan idarə olunur.
9) DOCX redaktə edilir, PDF-də Azərbaycan hərfləri, cədvəllər və düsturlar oxunaqlıdır.
10) Tələbə variantında şəxsi qeydlər və cavab açarları həm sənəddə, həm API cavabında yoxdur.
11) AI təklifi nəzərdən keçirilib seçilərək tətbiq edilir; xidmət olmadıqda saxta uğur göstərilmir.
12) Başqa istifadəçinin fənninə identifikatoru dəyişməklə giriş mümkün deyil.
13) Mövcud əsas funksiyalar və saxlanmış məlumatlar dəyişiklikdən sonra işləyir.

Sonda tətbiq olunan dəyişiklikləri, məlumat migrasiyalarını, yoxlama nəticələrini, quraşdırma ehtiyaclarını və açıq qalan real məhdudiyyətləri qısa təqdim et.

