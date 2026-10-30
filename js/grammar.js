// Grammatik-Lektionen. Jede steht am Ende eines Teils.
//
// explain:  Erklärung, Absätze mit "||" getrennt
// examples: Beispiele wie Sätze: "fremd = deutsch | …" (Chinesisch: "Zeichen = Pinyin = deutsch")
// drills:   Übungssätze mit Lücke ___ :
//           "Satz mit ___ = richtige Lösung = falsch / falsch / falsch = deutsche Bedeutung | …"
//           Chinesisch: "Satz mit ___ = Pinyin des ganzen Satzes (mit Lösung) = Lösung = falsch / … = deutsch"
// unit:     zu welchem Teil die Lektion gehört (0 = Teil 1)

(function () {
  function parseExamples(text) {
    return text.split("|").map((p) => p.split("=").map((s) => s.trim())).filter((p) => p[0])
      .map((p) => (p.length === 3 ? [p[0], p[2], p[1]] : p));
  }

  function parseDrills(text) {
    return text.split("|").map((d) => d.split("=").map((s) => s.trim())).filter((p) => p[0]).map((p) =>
      p.length === 5
        ? { s: p[0], py: p[1], a: p[2], wrong: p[3].split("/").map((x) => x.trim()), de: p[4] }
        : { s: p[0], a: p[1], wrong: p[2].split("/").map((x) => x.trim()), de: p[3] }
    );
  }

  function G(id, unit, title, g) {
    return {
      id, unit, title, icon: "📘", grammar: true, numbers: null, words: [],
      explain: g.explain.split("||").map((s) => s.trim()),
      sentences: parseExamples(g.examples),
      drills: parseDrills(g.drills),
      extraPy: g.extraPy || "",
    };
  }

  window.GRAMMAR = {
    es: [
      G("es-g1", 0, "Grammatik: der, die, ein, eine", {
        explain: "Jedes spanische Nomen ist männlich oder weiblich. Männlich: el (der) und un (ein). Weiblich: la (die) und una (eine). || Faustregel: Wörter auf -o sind meist männlich (el libro), Wörter auf -a meist weiblich (la casa). Ausnahmen gibt es, z. B. el día. || In der Mehrzahl wird el zu los und la zu las: los libros, las casas.",
        examples: "el chico = der Junge | la chica = das Mädchen | los chicos = die Jungen | las chicas = die Mädchen | un libro = ein Buch | una casa = ein Haus",
        drills: "___ pan es bueno = El = La / Los / Las = Das Brot ist gut | ___ manzana es roja = La = El / Los / Un = Der Apfel ist rot | Quiero ___ café = un = una / unos / la = Ich möchte einen Kaffee | Tengo ___ hermana = una = un / unos / el = Ich habe eine Schwester | ___ trenes llegan hoy = Los = El / La / Las = Die Züge kommen heute an | ___ playas son bonitas = Las = Los / La / El = Die Strände sind schön | Es ___ hotel grande = un = una / la / las = Es ist ein großes Hotel | ___ estación está cerca = La = El / Los / Un = Der Bahnhof ist in der Nähe",
      }),
      G("es-g2", 1, "Grammatik: ser und estar", {
        explain: "Spanisch hat zwei Verben für „sein“. || SER beschreibt, was oder wer etwas ist: Herkunft, Beruf, Eigenschaften. Soy alemán. Es médico. La casa es grande. || ESTAR beschreibt, wo oder wie etwas gerade ist: Ort und Befinden. Estoy cansado. Madrid está en España. || Formen: ser = soy, eres, es, somos, sois, son. estar = estoy, estás, está, estamos, estáis, están.",
        examples: "Soy alemán = Ich bin Deutscher | Eres simpático = Du bist nett | Es médico = Er ist Arzt | Estoy bien = Mir geht es gut | Está en casa = Er ist zu Hause | Estamos cansados = Wir sind müde",
        drills: "Yo ___ de Alemania = soy = estoy / es / está = Ich bin aus Deutschland | ¿Dónde ___ el baño? = está = es / son / soy = Wo ist das Bad? | Hoy ___ muy cansado = estoy = soy / es / eres = Heute bin ich sehr müde | Mi madre ___ profesora = es = está / soy / están = Meine Mutter ist Lehrerin | La casa ___ grande = es = está / soy / estás = Das Haus ist groß | Madrid ___ en España = está = es / son / estoy = Madrid liegt in Spanien | Tú ___ simpático = eres = estás / es / soy = Du bist nett | ¿Cómo ___ tú? = estás = eres / es / está = Wie geht es dir?",
      }),
      G("es-g3", 2, "Grammatik: Verben auf -ar", {
        explain: "Spanische Verben ändern ihre Endung je nach Person. Deshalb lässt man „ich“, „du“ usw. oft weg: Hablo español = Ich spreche Spanisch. || Bei Verben auf -ar (hablar = sprechen) nimmt man -ar weg und hängt an: -o (ich), -as (du), -a (er/sie), -amos (wir), -áis (ihr), -an (sie). || So geht es mit vielen Verben: trabajar, comprar, cocinar, bailar, viajar …",
        examples: "yo hablo = ich spreche | tú hablas = du sprichst | él habla = er spricht | nosotros hablamos = wir sprechen | vosotros habláis = ihr sprecht | ellos hablan = sie sprechen",
        drills: "Yo ___ español = hablo = hablas / habla / hablan = Ich spreche Spanisch | ¿Tú ___ inglés? = hablas = hablo / hablamos / habla = Sprichst du Englisch? | Ella ___ en una oficina = trabaja = trabajo / trabajas / trabajan = Sie arbeitet in einem Büro | Nosotros ___ mucho = bailamos = bailo / bailan / baila = Wir tanzen viel | Ellos ___ pan = compran = compra / compro / compramos = Sie kaufen Brot | Mi padre ___ la cena = cocina = cocino / cocinan / cocinas = Mein Vater kocht das Abendessen | Yo ___ con tarjeta = pago = paga / pagas / pagan = Ich bezahle mit Karte | ¿Vosotros ___ mañana? = viajáis = viajo / viaja / viajan = Reist ihr morgen?",
      }),
      G("es-g4", 3, "Grammatik: Verben auf -er und -ir", {
        explain: "Verben auf -er (comer = essen) bekommen: -o, -es, -e, -emos, -éis, -en. || Verben auf -ir (vivir = wohnen) bekommen fast dasselbe: -o, -es, -e, -imos, -ís, -en. || Merke: Bei „ich“ endet fast jedes Verb auf -o: hablo, como, vivo.",
        examples: "yo como = ich esse | tú comes = du isst | ella come = sie isst | yo vivo = ich wohne | nosotros vivimos = wir wohnen | ellos viven = sie wohnen",
        drills: "Yo ___ paella = como = come / comes / comen = Ich esse Paella | ¿Dónde ___ tú? = vives = vivo / vive / viven = Wo wohnst du? | Él ___ el periódico = lee = leo / lees / leen = Er liest die Zeitung | Nosotros ___ en Berlín = vivimos = vivo / viven / vive = Wir wohnen in Berlin | Ellos ___ agua = beben = bebe / bebo / bebemos = Sie trinken Wasser | Yo ___ una carta = escribo = escribe / escribes / escriben = Ich schreibe einen Brief | ¿Vosotros ___ carne? = coméis = comemos / comen / come = Esst ihr Fleisch? | Mi hermana ___ mucho = aprende = aprendo / aprendes / aprenden = Meine Schwester lernt viel",
      }),
      G("es-g5", 4, "Grammatik: Vergangenheit", {
        explain: "Für abgeschlossene Ereignisse (gestern, letztes Jahr) benutzt man das „pretérito indefinido“. || Verben auf -ar: hablé, hablaste, habló, hablamos, hablasteis, hablaron. || Verben auf -er/-ir: comí, comiste, comió, comimos, comisteis, comieron. || Wichtige unregelmäßige Formen: fui (ich ging/war), hice (ich machte), tuve (ich hatte), vi (ich sah).",
        examples: "hablé = ich sprach | hablaste = du sprachst | habló = er/sie sprach | comí = ich aß | comió = er/sie aß | fui = ich ging",
        drills: "Ayer yo ___ con Ana = hablé = hablo / habló / hablaste = Gestern sprach ich mit Ana | ¿Qué ___ tú ayer? = comiste = comí / comió / comes = Was hast du gestern gegessen? | El año pasado ella ___ a Madrid = viajó = viajé / viaja / viajaste = Letztes Jahr reiste sie nach Madrid | El verano pasado yo ___ a España = fui = voy / fueron / vas = Letzten Sommer fuhr ich nach Spanien | Ayer nosotros ___ una paella = hicimos = hacemos / hice / hizo = Gestern machten wir eine Paella | Ayer ellos ___ tarde = llegaron = llegan / llegó / llegué = Gestern kamen sie spät an | Anoche yo ___ muy bien = dormí = duermo / durmió / dormiste = Letzte Nacht schlief ich sehr gut | Ayer tú ___ una película = viste = ves / vi / vio = Gestern hast du einen Film gesehen",
      }),
      G("es-g6", 5, "Grammatik: reflexive Verben", {
        explain: "Manche Verben haben ein „sich“ dabei: llamarse (heißen), levantarse (aufstehen), ducharse (duschen). || Das „sich“ ändert sich mit der Person und steht vor dem Verb: me (mich), te (dich), se (sich), nos (uns), os (euch), se (sich). || Beispiel: me levanto (ich stehe auf), te levantas, se levanta, nos levantamos, os levantáis, se levantan.",
        examples: "me llamo = ich heiße | te levantas = du stehst auf | se ducha = er/sie duscht | nos acostamos = wir gehen ins Bett | os vestís = ihr zieht euch an | se quedan = sie bleiben",
        drills: "Yo ___ llamo Pedro = me = te / se / nos = Ich heiße Pedro | ¿Cómo ___ llamas? = te = me / se / os = Wie heißt du? | Ella ___ levanta a las siete = se = me / te / nos = Sie steht um sieben auf | Nosotros ___ duchamos por la mañana = nos = se / me / os = Wir duschen morgens | Mis padres ___ acuestan tarde = se = nos / me / te = Meine Eltern gehen spät ins Bett | ¿A qué hora ___ despiertas? = te = me / se / nos = Um wie viel Uhr wachst du auf? | Yo ___ visto rápido = me = se / te / nos = Ich ziehe mich schnell an | ¿Vosotros ___ quedáis en casa? = os = nos / se / te = Bleibt ihr zu Hause?",
      }),
      G("es-g7", 6, "Grammatik: Zukunft", {
        explain: "Neben „voy a“ + Grundform gibt es eine eigene Zukunftsform (futuro). || Sie ist ganz einfach: an die Grundform hängt man -é, -ás, -á, -emos, -éis, -án. Das gilt für alle Verben: hablaré, comeré, viviré. || Einige Verben haben einen kurzen Stamm: hacer → haré, tener → tendré, poder → podré, venir → vendré.",
        examples: "hablaré = ich werde sprechen | comerás = du wirst essen | vivirá = er/sie wird wohnen | haremos = wir werden machen | tendrán = sie werden haben | podré = ich werde können",
        drills: "Mañana ___ con mi jefe = hablaré = hablé / hablo / hablará = Morgen werde ich mit meinem Chef sprechen | ¿Qué ___ tú el sábado? = harás = haré / hiciste / hará = Was wirst du am Samstag machen? | El año que viene ella ___ en Madrid = vivirá = vivió / viviré / vivimos = Nächstes Jahr wird sie in Madrid wohnen | Mañana nosotros ___ a las ocho = llegaremos = llegué / llegaré / llegarán = Morgen werden wir um acht ankommen | Mañana ___ sol = hará = hizo / haré / harás = Morgen wird die Sonne scheinen | Ellos ___ mucho dinero = tendrán = tuvieron / tendré / tendrá = Sie werden viel Geld haben | Yo te ___ mañana = llamaré = llamé / llamó / llamarás = Ich werde dich morgen anrufen | ¿___ venir a la fiesta? = Podrás = Pudiste / Podré / Pudo = Wirst du zur Party kommen können?",
      }),
    ],

    fr: [
      G("fr-g1", 0, "Grammatik: der, die, ein, eine", {
        explain: "Jedes französische Nomen ist männlich oder weiblich. Männlich: le (der) und un (ein). Weiblich: la (die) und une (eine). || Vor einem Vokal oder stummen h werden le und la zu l': l'eau, l'hôtel. || In der Mehrzahl heißt es für beide les (die) und des (einige): les livres, des amis.",
        examples: "le garçon = der Junge | la fille = das Mädchen | les enfants = die Kinder | un livre = ein Buch | une maison = ein Haus | des amis = (einige) Freunde",
        drills: "___ pain est bon = Le = La / Les / Une = Das Brot ist gut | ___ pomme est rouge = La = Le / Les / Un = Der Apfel ist rot | Je veux ___ café = un = une / des / la = Ich möchte einen Kaffee | J'ai ___ sœur = une = un / des / le = Ich habe eine Schwester | ___ trains arrivent aujourd'hui = Les = Le / La / Un = Die Züge kommen heute an | C'est ___ grand hôtel = un = une / la / les = Das ist ein großes Hotel | ___ gare est à droite = La = Le / Les / Un = Der Bahnhof ist rechts | Il y a ___ plages = des = un / une / le = Es gibt Strände",
      }),
      G("fr-g2", 1, "Grammatik: être und avoir", {
        explain: "Die zwei wichtigsten Verben: être (sein) und avoir (haben). || être: je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont. || avoir: j'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont. || Achtung: Das Alter, Hunger und Durst „hat“ man im Französischen: J'ai trente ans. J'ai faim.",
        examples: "je suis = ich bin | tu es = du bist | il est = er ist | j'ai = ich habe | tu as = du hast | nous avons = wir haben",
        drills: "Je ___ allemand = suis = ai / es / est = Ich bin Deutscher | J'___ deux frères = ai = suis / as / a = Ich habe zwei Brüder | Tu ___ fatigué ? = es = as / est / suis = Bist du müde? | Il ___ trente ans = a = est / as / ai = Er ist dreißig Jahre alt | Nous ___ en France = sommes = avons / êtes / sont = Wir sind in Frankreich | Vous ___ une voiture ? = avez = êtes / avons / ont = Haben Sie ein Auto? | Elles ___ contentes = sont = ont / est / sommes = Sie sind zufrieden | Ils ___ faim = ont = sont / a / avons = Sie haben Hunger",
      }),
      G("fr-g3", 2, "Grammatik: Verben auf -er", {
        explain: "Die meisten französischen Verben enden auf -er (parler = sprechen). || Man nimmt -er weg und hängt an: -e (je), -es (tu), -e (il/elle), -ons (nous), -ez (vous), -ent (ils/elles). || Gute Nachricht: je parle, tu parles, il parle und ils parlent klingen alle gleich! Nur nous parlons und vous parlez hört man anders.",
        examples: "je parle = ich spreche | tu parles = du sprichst | il parle = er spricht | nous parlons = wir sprechen | vous parlez = ihr sprecht / Sie sprechen | ils parlent = sie sprechen",
        drills: "Je ___ français = parle = parles / parlons / parlent = Ich spreche Französisch | Tu ___ dans un bureau ? = travailles = travaille / travaillons / travaillent = Arbeitest du in einem Büro? | Nous ___ beaucoup = dansons = danse / dansez / dansent = Wir tanzen viel | Ils ___ du pain = achètent = achète / achetons / achetez = Sie kaufen Brot | Vous ___ à Paris ? = habitez = habite / habitons / habitent = Wohnen Sie in Paris? | Elle ___ la musique = aime = aimes / aimons / aiment = Sie mag Musik | Mon père ___ le dîner = prépare = prépares / préparons / préparent = Mein Vater bereitet das Abendessen zu | Nous ___ par carte = payons = paie / payez / paient = Wir bezahlen mit Karte",
      }),
      G("fr-g4", 3, "Grammatik: Verneinung", {
        explain: "Verneinen heißt im Französischen: ne … pas um das Verb herum. Je parle → Je ne parle pas. || Vor einem Vokal wird ne zu n': Je n'aime pas. Ce n'est pas cher. || Nach der Verneinung wird un/une/du zu de: Je mange de la viande → Je ne mange pas de viande.",
        examples: "je ne parle pas = ich spreche nicht | ce n'est pas cher = das ist nicht teuer | je n'aime pas = ich mag nicht | il ne mange pas de viande = er isst kein Fleisch | nous ne travaillons pas = wir arbeiten nicht | elle n'est pas là = sie ist nicht da",
        drills: "Je ___ parle pas anglais = ne = pas / non / n' = Ich spreche kein Englisch | Ce n'est ___ cher = pas = ne / non / rien = Das ist nicht teuer | Il ne travaille ___ aujourd'hui = pas = ne / non / oui = Er arbeitet heute nicht | Je ___ aime pas le café = n' = ne / pas / non = Ich mag keinen Kaffee | Nous ne mangeons pas ___ viande = de = du / la / une = Wir essen kein Fleisch | Elle ___ est pas fatiguée = n' = ne / pas / non = Sie ist nicht müde | Tu ne viens ___ ? = pas = ne / non / oui = Kommst du nicht? | Je n'ai pas ___ voiture = de = une / la / un = Ich habe kein Auto",
      }),
      G("fr-g5", 4, "Grammatik: Vergangenheit", {
        explain: "Die häufigste Vergangenheit ist das passé composé: avoir + Partizip. J'ai mangé = ich habe gegessen. || Partizip: Verben auf -er enden auf -é (parlé, mangé). Unregelmäßig sind z. B. vu (gesehen), fait (gemacht), pris (genommen). || Bei Verben der Bewegung (aller, venir, partir, arriver …) nimmt man être: je suis allé. Dann passt sich das Partizip an: elle est allée.",
        examples: "j'ai mangé = ich habe gegessen | tu as parlé = du hast gesprochen | il a vu = er hat gesehen | je suis allé = ich bin gegangen | elle est arrivée = sie ist angekommen | nous avons fait = wir haben gemacht",
        drills: "Hier j'___ mangé une pizza = ai = suis / as / a = Gestern habe ich eine Pizza gegessen | Elle ___ allée au cinéma = est = a / ai / es = Sie ist ins Kino gegangen | Nous avons ___ avec le chef = parlé = parler / parle / parlons = Wir haben mit dem Chef gesprochen | Tu ___ vu le film ? = as = es / a / ai = Hast du den Film gesehen? | Ils ___ arrivés hier = sont = ont / est / a = Sie sind gestern angekommen | J'ai ___ un livre = acheté = acheter / achète / achetez = Ich habe ein Buch gekauft | Vous ___ bien dormi ? = avez = êtes / avons / ont = Haben Sie gut geschlafen? | Je suis ___ à huit heures = parti = partir / pars / part = Ich bin um acht Uhr losgefahren",
      }),
      G("fr-g6", 5, "Grammatik: reflexive Verben", {
        explain: "Manche Verben haben ein „sich“ dabei: s'appeler (heißen), se lever (aufstehen), se coucher (ins Bett gehen). || Das „sich“ ändert sich mit der Person: me, te, se, nous, vous, se. Vor einem Vokal: m', t', s'. || Beispiel: je me lève, tu te lèves, il se lève, nous nous levons, vous vous levez, ils se lèvent.",
        examples: "je me lève = ich stehe auf | tu te lèves = du stehst auf | il se lève = er steht auf | nous nous levons = wir stehen auf | vous vous levez = ihr steht auf | ils se lèvent = sie stehen auf",
        drills: "Je ___ appelle Paul = m' = t' / s' / me = Ich heiße Paul | Tu ___ lèves à quelle heure ? = te = me / se / nous = Um wie viel Uhr stehst du auf? | Elle ___ douche le matin = se = me / te / nous = Sie duscht morgens | Nous ___ couchons tard = nous = vous / se / me = Wir gehen spät ins Bett | Vous ___ reposez le dimanche ? = vous = nous / se / te = Ruhen Sie sich sonntags aus? | Ils ___ habillent vite = s' = se / m' / t' = Sie ziehen sich schnell an | Je ___ réveille à sept heures = me = te / se / m' = Ich wache um sieben Uhr auf | Comment tu ___ appelles ? = t' = m' / s' / te = Wie heißt du?",
      }),
      G("fr-g7", 6, "Grammatik: Zukunft", {
        explain: "Neben „je vais“ + Grundform gibt es eine eigene Zukunftsform (futur simple). || An die Grundform hängt man: -ai, -as, -a, -ons, -ez, -ont. parler → je parlerai. Bei Verben auf -re fällt das e weg: prendre → je prendrai. || Wichtige unregelmäßige Formen: être → je serai, avoir → j'aurai, faire → je ferai, venir → je viendrai, aller → j'irai.",
        examples: "je parlerai = ich werde sprechen | tu mangeras = du wirst essen | il fera = er wird machen | nous serons = wir werden sein | vous aurez = ihr werdet haben | ils viendront = sie werden kommen",
        drills: "Demain je ___ à Paris = partirai = partirons / partira / partiras = Morgen werde ich nach Paris fahren | Demain il ___ beau = fera = ferai / feras / feront = Morgen wird es schön | Nous ___ à huit heures = arriverons = arriverai / arrivera / arriveront = Wir werden um acht Uhr ankommen | Est-ce que tu ___ demain ? = viendras = viendrai / viendra / viendront = Wirst du morgen kommen? | Ils ___ beaucoup d'argent = auront = aura / aurai / aurons = Sie werden viel Geld haben | Je t'___ demain = appellerai = appelleras / appellera / appelleront = Ich werde dich morgen anrufen | Vous ___ contents = serez = serai / sera / seront = Ihr werdet zufrieden sein | Elle ___ en France l'année prochaine = habitera = habiterai / habiteras / habiteront = Sie wird nächstes Jahr in Frankreich wohnen",
      }),
    ],

    zh: [
      G("zh-g1", 0, "Grammatik: Satzbau", {
        explain: "Chinesische Sätze sind wie im Deutschen gebaut: Wer – macht – was. 我喝茶 = Ich trinke Tee. || Verben ändern sich nie! 我是, 你是, 他是 = ich bin, du bist, er ist. Es gibt auch keine Artikel (der, die, das). || Vor Adjektiven steht meist 很 (hěn): 我很好 = Mir geht es gut. Zwischen Zahl und Ding steht ein Zählwort, meist 个 (ge).",
        examples: "我 是 德国人 = wǒ shì déguórén = Ich bin Deutscher | 他 喝 茶 = tā hē chá = Er trinkt Tee | 我 吃 米饭 = wǒ chī mǐfàn = Ich esse Reis | 我 很 好 = wǒ hěn hǎo = Mir geht es gut | 我 有 一 个 哥哥 = wǒ yǒu yí ge gēge = Ich habe einen älteren Bruder | 你 好 吗？ = nǐ hǎo ma? = Wie geht es dir?",
        drills: "我 ___ 德国人 = wǒ shì déguórén = 是 = 很 / 有 / 的 = Ich bin Deutscher | 他 ___ 茶 = tā hē chá = 喝 = 是 / 很 / 吗 = Er trinkt Tee | 我 ___ 饺子 = wǒ chī jiǎozi = 吃 = 是 / 很 / 吗 = Ich esse Teigtaschen | 你 ___ 中国人 吗？ = nǐ shì zhōngguórén ma? = 是 = 很 / 有 / 吃 = Bist du Chinese? | 我 有 一 ___ 哥哥 = wǒ yǒu yí ge gēge = 个 = 是 / 很 / 的 = Ich habe einen älteren Bruder | 你 好 ___？ = nǐ hǎo ma? = 吗 = 是 / 很 / 个 = Wie geht es dir? | 我 ___ 好 = wǒ hěn hǎo = 很 = 是 / 有 / 吗 = Mir geht es gut | 他 ___ 两 个 孩子 = tā yǒu liǎng ge háizi = 有 = 是 / 很 / 吗 = Er hat zwei Kinder",
        extraPy: "吗 = ma",
      }),
      G("zh-g2", 1, "Grammatik: Fragen und Verneinung", {
        explain: "Eine Ja/Nein-Frage macht man ganz einfach: 吗 (ma) ans Ende. 你喝咖啡 = Du trinkst Kaffee. 你喝咖啡吗？ = Trinkst du Kaffee? || Verneint wird mit 不 (bù) direkt vor dem Verb oder Adjektiv: 我不喝咖啡 = Ich trinke keinen Kaffee. || Achtung: Vor einem Wort im 4. Ton spricht man 不 als bú: 不是 (bú shì).",
        examples: "你 喝 咖啡 吗？ = nǐ hē kāfēi ma? = Trinkst du Kaffee? | 我 不 喝 咖啡 = wǒ bù hē kāfēi = Ich trinke keinen Kaffee | 你 是 中国人 吗？ = nǐ shì zhōngguórén ma? = Bist du Chinese? | 我 不 是 中国人 = wǒ bú shì zhōngguórén = Ich bin kein Chinese | 他 不 忙 = tā bù máng = Er ist nicht beschäftigt | 你 喜欢 茶 吗？ = nǐ xǐhuan chá ma? = Magst du Tee?",
        drills: "你 喝 咖啡 ___？ = nǐ hē kāfēi ma? = 吗 = 不 / 是 / 很 = Trinkst du Kaffee? | 我 ___ 喝 咖啡 = wǒ bù hē kāfēi = 不 = 吗 / 是 / 很 = Ich trinke keinen Kaffee | 他 ___ 是 老师 = tā bú shì lǎoshī = 不 = 吗 / 很 / 有 = Er ist kein Lehrer | 这 个 贵 ___？ = zhè ge guì ma? = 吗 = 不 / 个 / 是 = Ist das teuer? | 我 ___ 喜欢 黑色 = wǒ bù xǐhuan hēisè = 不 = 吗 / 是 / 很 = Ich mag kein Schwarz | 今天 你 忙 ___？ = jīntiān nǐ máng ma? = 吗 = 不 / 很 / 是 = Bist du heute beschäftigt? | 她 ___ 吃 肉 = tā bù chī ròu = 不 = 吗 / 是 / 有 = Sie isst kein Fleisch | 你 有 钱 ___？ = nǐ yǒu qián ma? = 吗 = 不 / 是 / 很 = Hast du Geld?",
        extraPy: "她 = tā",
      }),
      G("zh-g3", 2, "Grammatik: Zählwörter", {
        explain: "Im Chinesischen braucht man zwischen Zahl und Ding ein Zählwort, so wie im Deutschen „eine Tasse Tee“ oder „ein Paar Schuhe“ – nur eben immer. || Das häufigste ist 个 (ge). Es passt fast immer, wenn man unsicher ist. || Weitere: 杯 (bēi) für Getränke, 本 (běn) für Bücher, 只 (zhī) für viele Tiere, 件 (jiàn) für Kleidung, 双 (shuāng) für Paare. || Auch nach 这 (dies) und 那 (das) steht ein Zählwort: 这本书 = dieses Buch.",
        examples: "一 个 人 = yí ge rén = eine Person | 两 杯 水 = liǎng bēi shuǐ = zwei Gläser Wasser | 三 本 书 = sān běn shū = drei Bücher | 一 只 狗 = yì zhī gǒu = ein Hund | 一 件 衣服 = yí jiàn yīfu = ein Kleidungsstück | 一 双 鞋 = yì shuāng xié = ein Paar Schuhe",
        drills: "一 ___ 茶 = yì bēi chá = 杯 = 本 / 只 / 件 = Eine Tasse Tee | 两 ___ 书 = liǎng běn shū = 本 = 杯 / 只 / 件 = Zwei Bücher | 三 ___ 猫 = sān zhī māo = 只 = 本 / 杯 / 件 = Drei Katzen | 一 ___ 衬衫 = yí jiàn chènshān = 件 = 只 / 本 / 杯 = Ein Hemd | 五 ___ 学生 = wǔ ge xuésheng = 个 = 本 / 只 / 杯 = Fünf Schüler | 一 ___ 鞋 = yì shuāng xié = 双 = 本 / 杯 / 只 = Ein Paar Schuhe | 这 ___ 书 很 好 = zhè běn shū hěn hǎo = 本 = 杯 / 件 / 只 = Dieses Buch ist sehr gut | 我 要 两 ___ 咖啡 = wǒ yào liǎng bēi kāfēi = 杯 = 本 / 只 / 件 = Ich möchte zwei Tassen Kaffee",
      }),
      G("zh-g4", 3, "Grammatik: 了 und 过", {
        explain: "Chinesische Verben haben keine Zeitformen. Ob etwas vorbei ist, zeigen kleine Wörter. || 了 (le) zeigt: Es ist passiert oder hat sich geändert. 他来了 = Er ist gekommen. 我饿了 = Ich habe (jetzt) Hunger. || 过 (guo) nach dem Verb heißt: schon einmal erlebt. 我去过中国 = Ich war schon einmal in China. || Verneint wird Vergangenes mit 没 (méi): 我没去过北京 = Ich war noch nie in Peking.",
        examples: "我 吃 饭 了 = wǒ chī fàn le = Ich habe gegessen | 他 来 了 = tā lái le = Er ist gekommen | 我 去 过 中国 = wǒ qù guo Zhōngguó = Ich war schon einmal in China | 我 没 去 过 北京 = wǒ méi qù guo Běijīng = Ich war noch nie in Peking | 下雨 了 = xiàyǔ le = Es regnet (jetzt) | 你 吃 过 饺子 吗？ = nǐ chī guo jiǎozi ma? = Hast du schon mal Teigtaschen gegessen?",
        drills: "我 吃 饭 ___ = wǒ chī fàn le = 了 = 吗 / 不 / 很 = Ich habe gegessen | 你 去 ___ 中国 吗？ = nǐ qù guo Zhōngguó ma? = 过 = 吗 / 很 / 不 = Warst du schon einmal in China? | 他 来 ___ = tā lái le = 了 = 吗 / 很 / 是 = Er ist gekommen | 我 没 去 ___ 北京 = wǒ méi qù guo Běijīng = 过 = 吗 / 很 / 是 = Ich war noch nie in Peking | 你 吃 ___ 饺子 吗？ = nǐ chī guo jiǎozi ma? = 过 = 很 / 是 / 不 = Hast du schon mal Teigtaschen gegessen? | 我 饿 ___ = wǒ è le = 了 = 吗 / 很 / 是 = Ich habe (jetzt) Hunger | 下雨 ___ = xiàyǔ le = 了 = 很 / 是 / 不 = Es regnet (jetzt) | 他 走 ___ = tā zǒu le = 了 = 吗 / 很 / 是 = Er ist gegangen",
      }),
      G("zh-g5", 4, "Grammatik: Ort und Zeit", {
        explain: "Die Reihenfolge im chinesischen Satz ist fest: Wer – Wann – Wo – Was. || Die Zeit steht vorne (vor oder nach dem Subjekt): 明天我去上海 = Morgen fahre ich nach Shanghai. || Der Ort kommt mit 在 (zài) vor das Verb: 我在北京工作 = Ich arbeite in Peking (wörtlich: ich in Peking arbeite). || 在 allein heißt „sein in/an“: 妈妈在厨房 = Mama ist in der Küche.",
        examples: "我 在 北京 工作 = wǒ zài Běijīng gōngzuò = Ich arbeite in Peking | 明天 我 去 上海 = míngtiān wǒ qù Shànghǎi = Morgen fahre ich nach Shanghai | 妈妈 在 厨房 = māma zài chúfáng = Mama ist in der Küche | 你 在 哪里？ = nǐ zài nǎlǐ? = Wo bist du? | 我 在 家 看 电视 = wǒ zài jiā kàn diànshì = Ich sehe zu Hause fern | 今天 晚上 我 在 家 = jīntiān wǎnshang wǒ zài jiā = Heute Abend bin ich zu Hause",
        drills: "我 ___ 北京 工作 = wǒ zài Běijīng gōngzuò = 在 = 是 / 很 / 了 = Ich arbeite in Peking | ___ 我 去 上海 = míngtiān wǒ qù Shànghǎi = 明天 = 昨天 / 了 / 过 = Morgen fahre ich nach Shanghai | 妈妈 ___ 厨房 = māma zài chúfáng = 在 = 是 / 很 / 吗 = Mama ist in der Küche | 你 ___ 哪里？ = nǐ zài nǎlǐ? = 在 = 是 / 很 / 了 = Wo bist du? | 我 在 家 ___ 电视 = wǒ zài jiā kàn diànshì = 看 = 吃 / 喝 / 是 = Ich sehe zu Hause fern | 今天 晚上 我 ___ 家 = jīntiān wǎnshang wǒ zài jiā = 在 = 是 / 很 / 吗 = Heute Abend bin ich zu Hause | 我 ___ 公司 吃 饭 = wǒ zài gōngsī chī fàn = 在 = 是 / 很 / 了 = Ich esse in der Firma | ___ 八 点 我 上班 = zǎoshang bā diǎn wǒ shàngbān = 早上 = 晚安 / 了 / 吗 = Morgens um acht gehe ich zur Arbeit",
        extraPy: "早上 = zǎoshang",
      }),
      G("zh-g6", 5, "Grammatik: Vergleiche mit 比", {
        explain: "Vergleiche macht man mit 比 (bǐ): A 比 B + Adjektiv. 他比我高 = Er ist größer als ich (wörtlich: er verglichen mit mir groß). || Wichtig: Nach 比 steht KEIN 很! Falsch: 他比我很高. Richtig: 他比我高. || Den Unterschied hängt man hinten an: 哥哥比我大两岁 = Mein Bruder ist zwei Jahre älter als ich.",
        examples: "他 比 我 高 = tā bǐ wǒ gāo = Er ist größer als ich | 今天 比 昨天 冷 = jīntiān bǐ zuótiān lěng = Heute ist es kälter als gestern | 火车 比 飞机 慢 = huǒchē bǐ fēijī màn = Der Zug ist langsamer als das Flugzeug | 这 个 比 那 个 便宜 = zhè ge bǐ nà ge piányi = Das hier ist billiger als das da | 哥哥 比 我 大 两 岁 = gēge bǐ wǒ dà liǎng suì = Mein Bruder ist zwei Jahre älter als ich | 中文 比 英文 难 = Zhōngwén bǐ Yīngwén nán = Chinesisch ist schwerer als Englisch",
        drills: "他 ___ 我 高 = tā bǐ wǒ gāo = 比 = 很 / 在 / 是 = Er ist größer als ich | 今天 比 昨天 ___ = jīntiān bǐ zuótiān lěng = 冷 = 很冷 / 了 / 吗 = Heute ist es kälter als gestern | 火车 ___ 飞机 慢 = huǒchē bǐ fēijī màn = 比 = 很 / 在 / 是 = Der Zug ist langsamer als das Flugzeug | 我 的 房间 比 你 的 ___ = wǒ de fángjiān bǐ nǐ de dà = 大 = 很大 / 吗 / 了 = Mein Zimmer ist größer als deins | 这 个 比 那 个 ___ = zhè ge bǐ nà ge piányi = 便宜 = 很便宜 / 吗 / 是 = Das hier ist billiger als das da | 北京 ___ 上海 冷 = Běijīng bǐ Shànghǎi lěng = 比 = 很 / 在 / 是 = Peking ist kälter als Shanghai | 哥哥 比 我 ___ 两 岁 = gēge bǐ wǒ dà liǎng suì = 大 = 很大 / 了 / 吗 = Mein Bruder ist zwei Jahre älter als ich | 中文 ___ 英文 难 = Zhōngwén bǐ Yīngwén nán = 比 = 很 / 在 / 是 = Chinesisch ist schwerer als Englisch",
        extraPy: "很冷 = hěn lěng; 很大 = hěn dà; 很便宜 = hěn piányi",
      }),
    ],
  };
})();
