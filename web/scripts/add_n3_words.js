const fs = require('fs');
const path = require('path');

// 새로운 N3 단어 228개 (n3_w2773 ~ n3_w3000)
const newN3Words = [
  // 일상생활 관련 (30개)
  { word: "洗濯", reading: "せんたく", meaning: "세탁", meaningDetail: "옷을 빨다", category: "명사", examples: [{ ja: "洗濯物を干す。", ko: "빨래를 널다." }] },
  { word: "掃除", reading: "そうじ", meaning: "청소", meaningDetail: "깨끗이 치우다", category: "명사", examples: [{ ja: "部屋の掃除をする。", ko: "방 청소를 하다." }] },
  { word: "買い物", reading: "かいもの", meaning: "쇼핑", meaningDetail: "물건을 사다", category: "명사", examples: [{ ja: "週末に買い物に行く。", ko: "주말에 쇼핑하러 가다." }] },
  { word: "料理", reading: "りょうり", meaning: "요리", meaningDetail: "음식을 만들다", category: "명사", examples: [{ ja: "母の料理は美味しい。", ko: "어머니의 요리는 맛있다." }] },
  { word: "散歩", reading: "さんぽ", meaning: "산책", meaningDetail: "걸어다니다", category: "명사", examples: [{ ja: "犬と散歩する。", ko: "개와 산책하다." }] },
  { word: "睡眠", reading: "すいみん", meaning: "수면", meaningDetail: "잠", category: "명사", examples: [{ ja: "睡眠時間が足りない。", ko: "수면 시간이 부족하다." }] },
  { word: "起床", reading: "きしょう", meaning: "기상", meaningDetail: "일어나다", category: "명사", examples: [{ ja: "起床時間は6時だ。", ko: "기상 시간은 6시다." }] },
  { word: "就寝", reading: "しゅうしん", meaning: "취침", meaningDetail: "잠자리에 들다", category: "명사", examples: [{ ja: "就寝前に本を読む。", ko: "취침 전에 책을 읽다." }] },
  { word: "入浴", reading: "にゅうよく", meaning: "입욕", meaningDetail: "목욕하다", category: "명사", examples: [{ ja: "入浴中は電話に出られない。", ko: "목욕 중에는 전화를 받을 수 없다." }] },
  { word: "着替え", reading: "きがえ", meaning: "옷갈아입기", meaningDetail: "옷을 바꿔 입다", category: "명사", examples: [{ ja: "着替えを持って行く。", ko: "갈아입을 옷을 가져가다." }] },
  { word: "通勤", reading: "つうきん", meaning: "통근", meaningDetail: "출퇴근", category: "명사", examples: [{ ja: "通勤に1時間かかる。", ko: "통근에 1시간 걸린다." }] },
  { word: "通学", reading: "つうがく", meaning: "통학", meaningDetail: "학교 왕복", category: "명사", examples: [{ ja: "自転車で通学する。", ko: "자전거로 통학하다." }] },
  { word: "帰宅", reading: "きたく", meaning: "귀가", meaningDetail: "집에 돌아오다", category: "명사", examples: [{ ja: "帰宅が遅くなった。", ko: "귀가가 늦어졌다." }] },
  { word: "外出", reading: "がいしゅつ", meaning: "외출", meaningDetail: "밖에 나가다", category: "명사", examples: [{ ja: "外出中に雨が降った。", ko: "외출 중에 비가 내렸다." }] },
  { word: "留守", reading: "るす", meaning: "부재", meaningDetail: "집에 없음", category: "명사", examples: [{ ja: "留守番をする。", ko: "집을 보다." }] },
  { word: "片付け", reading: "かたづけ", meaning: "정리", meaningDetail: "정돈하다", category: "명사", examples: [{ ja: "部屋の片付けをする。", ko: "방 정리를 하다." }] },
  { word: "支度", reading: "したく", meaning: "준비", meaningDetail: "채비", category: "명사", examples: [{ ja: "出かける支度をする。", ko: "외출 준비를 하다." }] },
  { word: "準備", reading: "じゅんび", meaning: "준비", meaningDetail: "미리 갖추다", category: "명사", examples: [{ ja: "試験の準備をする。", ko: "시험 준비를 하다." }] },
  { word: "用意", reading: "ようい", meaning: "용의", meaningDetail: "준비", category: "명사", examples: [{ ja: "食事の用意ができた。", ko: "식사 준비가 되었다." }] },
  { word: "世話", reading: "せわ", meaning: "돌봄", meaningDetail: "보살피다", category: "명사", examples: [{ ja: "子供の世話をする。", ko: "아이를 돌보다." }] },
  { word: "面倒", reading: "めんどう", meaning: "귀찮음", meaningDetail: "번거로움", category: "명사", examples: [{ ja: "面倒なことは嫌いだ。", ko: "귀찮은 일은 싫다." }] },
  { word: "手伝い", reading: "てつだい", meaning: "도움", meaningDetail: "거들다", category: "명사", examples: [{ ja: "家事の手伝いをする。", ko: "집안일을 돕다." }] },
  { word: "相談", reading: "そうだん", meaning: "상담", meaningDetail: "의논하다", category: "명사", examples: [{ ja: "友達に相談する。", ko: "친구에게 상담하다." }] },
  { word: "約束", reading: "やくそく", meaning: "약속", meaningDetail: "정하다", category: "명사", examples: [{ ja: "約束を守る。", ko: "약속을 지키다." }] },
  { word: "予定", reading: "よてい", meaning: "예정", meaningDetail: "계획", category: "명사", examples: [{ ja: "明日の予定は何ですか。", ko: "내일 예정은 무엇입니까?" }] },
  { word: "計画", reading: "けいかく", meaning: "계획", meaningDetail: "기획", category: "명사", examples: [{ ja: "旅行の計画を立てる。", ko: "여행 계획을 세우다." }] },
  { word: "予約", reading: "よやく", meaning: "예약", meaningDetail: "미리 정하다", category: "명사", examples: [{ ja: "レストランを予約する。", ko: "레스토랑을 예약하다." }] },
  { word: "注文", reading: "ちゅうもん", meaning: "주문", meaningDetail: "시키다", category: "명사", examples: [{ ja: "料理を注文する。", ko: "요리를 주문하다." }] },
  { word: "会計", reading: "かいけい", meaning: "계산", meaningDetail: "지불", category: "명사", examples: [{ ja: "会計をお願いします。", ko: "계산 부탁합니다." }] },
  { word: "領収書", reading: "りょうしゅうしょ", meaning: "영수증", meaningDetail: "받은 표", category: "명사", examples: [{ ja: "領収書をください。", ko: "영수증 주세요." }] },

  // 감정/심리 관련 (25개)
  { word: "感動", reading: "かんどう", meaning: "감동", meaningDetail: "마음이 움직이다", category: "명사", examples: [{ ja: "映画に感動した。", ko: "영화에 감동했다." }] },
  { word: "感謝", reading: "かんしゃ", meaning: "감사", meaningDetail: "고마움", category: "명사", examples: [{ ja: "心から感謝します。", ko: "진심으로 감사합니다." }] },
  { word: "興奮", reading: "こうふん", meaning: "흥분", meaningDetail: "들뜨다", category: "명사", examples: [{ ja: "試合に興奮する。", ko: "시합에 흥분하다." }] },
  { word: "緊張", reading: "きんちょう", meaning: "긴장", meaningDetail: "조마조마", category: "명사", examples: [{ ja: "面接で緊張した。", ko: "면접에서 긴장했다." }] },
  { word: "不安", reading: "ふあん", meaning: "불안", meaningDetail: "걱정", category: "명사", examples: [{ ja: "将来に不安を感じる。", ko: "미래에 불안을 느끼다." }] },
  { word: "心配", reading: "しんぱい", meaning: "걱정", meaningDetail: "염려", category: "명사", examples: [{ ja: "子供のことが心配だ。", ko: "아이가 걱정된다." }] },
  { word: "安心", reading: "あんしん", meaning: "안심", meaningDetail: "마음 놓다", category: "명사", examples: [{ ja: "結果を聞いて安心した。", ko: "결과를 듣고 안심했다." }] },
  { word: "満足", reading: "まんぞく", meaning: "만족", meaningDetail: "흡족하다", category: "명사", examples: [{ ja: "結果に満足する。", ko: "결과에 만족하다." }] },
  { word: "不満", reading: "ふまん", meaning: "불만", meaningDetail: "못마땅함", category: "명사", examples: [{ ja: "サービスに不満がある。", ko: "서비스에 불만이 있다." }] },
  { word: "期待", reading: "きたい", meaning: "기대", meaningDetail: "바라다", category: "명사", examples: [{ ja: "成功を期待する。", ko: "성공을 기대하다." }] },
  { word: "失望", reading: "しつぼう", meaning: "실망", meaningDetail: "낙담", category: "명사", examples: [{ ja: "結果に失望した。", ko: "결과에 실망했다." }] },
  { word: "希望", reading: "きぼう", meaning: "희망", meaningDetail: "바람", category: "명사", examples: [{ ja: "希望を持って生きる。", ko: "희망을 갖고 살다." }] },
  { word: "絶望", reading: "ぜつぼう", meaning: "절망", meaningDetail: "포기", category: "명사", examples: [{ ja: "絶望的な状況だ。", ko: "절망적인 상황이다." }] },
  { word: "喜び", reading: "よろこび", meaning: "기쁨", meaningDetail: "즐거움", category: "명사", examples: [{ ja: "喜びを感じる。", ko: "기쁨을 느끼다." }] },
  { word: "悲しみ", reading: "かなしみ", meaning: "슬픔", meaningDetail: "서러움", category: "명사", examples: [{ ja: "悲しみを乗り越える。", ko: "슬픔을 극복하다." }] },
  { word: "怒り", reading: "いかり", meaning: "분노", meaningDetail: "화", category: "명사", examples: [{ ja: "怒りを抑える。", ko: "분노를 억누르다." }] },
  { word: "恐怖", reading: "きょうふ", meaning: "공포", meaningDetail: "두려움", category: "명사", examples: [{ ja: "恐怖を感じる。", ko: "공포를 느끼다." }] },
  { word: "驚き", reading: "おどろき", meaning: "놀라움", meaningDetail: "깜짝", category: "명사", examples: [{ ja: "驚きの連続だ。", ko: "놀라움의 연속이다." }] },
  { word: "退屈", reading: "たいくつ", meaning: "지루함", meaningDetail: "심심함", category: "명사", examples: [{ ja: "退屈な映画だった。", ko: "지루한 영화였다." }] },
  { word: "興味", reading: "きょうみ", meaning: "흥미", meaningDetail: "관심", category: "명사", examples: [{ ja: "日本語に興味がある。", ko: "일본어에 흥미가 있다." }] },
  { word: "関心", reading: "かんしん", meaning: "관심", meaningDetail: "주의", category: "명사", examples: [{ ja: "環境問題に関心を持つ。", ko: "환경 문제에 관심을 갖다." }] },
  { word: "好奇心", reading: "こうきしん", meaning: "호기심", meaningDetail: "궁금증", category: "명사", examples: [{ ja: "好奇心が旺盛だ。", ko: "호기심이 왕성하다." }] },
  { word: "自信", reading: "じしん", meaning: "자신감", meaningDetail: "확신", category: "명사", examples: [{ ja: "自信を持って話す。", ko: "자신감을 갖고 말하다." }] },
  { word: "勇気", reading: "ゆうき", meaning: "용기", meaningDetail: "배짱", category: "명사", examples: [{ ja: "勇気を出して挑戦する。", ko: "용기를 내어 도전하다." }] },
  { word: "根気", reading: "こんき", meaning: "끈기", meaningDetail: "인내", category: "명사", examples: [{ ja: "根気よく続ける。", ko: "끈기 있게 계속하다." }] },

  // 동사 (50개)
  { word: "集める", reading: "あつめる", meaning: "모으다", meaningDetail: "한곳에 모으다", category: "동사", verbType: "2그룹", examples: [{ ja: "情報を集める。", ko: "정보를 모으다." }] },
  { word: "届ける", reading: "とどける", meaning: "전달하다", meaningDetail: "보내다", category: "동사", verbType: "2그룹", examples: [{ ja: "荷物を届ける。", ko: "짐을 전달하다." }] },
  { word: "届く", reading: "とどく", meaning: "도착하다", meaningDetail: "닿다", category: "동사", verbType: "1그룹", examples: [{ ja: "手紙が届いた。", ko: "편지가 도착했다." }] },
  { word: "伝える", reading: "つたえる", meaning: "전하다", meaningDetail: "알리다", category: "동사", verbType: "2그룹", examples: [{ ja: "メッセージを伝える。", ko: "메시지를 전하다." }] },
  { word: "伝わる", reading: "つたわる", meaning: "전해지다", meaningDetail: "알려지다", category: "동사", verbType: "1그룹", examples: [{ ja: "気持ちが伝わる。", ko: "마음이 전해지다." }] },
  { word: "比べる", reading: "くらべる", meaning: "비교하다", meaningDetail: "견주다", category: "동사", verbType: "2그룹", examples: [{ ja: "二つを比べる。", ko: "둘을 비교하다." }] },
  { word: "調べる", reading: "しらべる", meaning: "조사하다", meaningDetail: "알아보다", category: "동사", verbType: "2그룹", examples: [{ ja: "辞書で調べる。", ko: "사전에서 찾아보다." }] },
  { word: "確かめる", reading: "たしかめる", meaning: "확인하다", meaningDetail: "점검하다", category: "동사", verbType: "2그룹", examples: [{ ja: "予定を確かめる。", ko: "예정을 확인하다." }] },
  { word: "試す", reading: "ためす", meaning: "시험하다", meaningDetail: "테스트하다", category: "동사", verbType: "1그룹", examples: [{ ja: "新しい方法を試す。", ko: "새로운 방법을 시험하다." }] },
  { word: "試みる", reading: "こころみる", meaning: "시도하다", meaningDetail: "도전하다", category: "동사", verbType: "2그룹", examples: [{ ja: "脱出を試みる。", ko: "탈출을 시도하다." }] },
  { word: "挑戦", reading: "ちょうせん", meaning: "도전", meaningDetail: "시도", category: "명사", examples: [{ ja: "新しいことに挑戦する。", ko: "새로운 것에 도전하다." }] },
  { word: "諦める", reading: "あきらめる", meaning: "포기하다", meaningDetail: "단념하다", category: "동사", verbType: "2그룹", examples: [{ ja: "夢を諦める。", ko: "꿈을 포기하다." }] },
  { word: "頑張る", reading: "がんばる", meaning: "힘내다", meaningDetail: "노력하다", category: "동사", verbType: "1그룹", examples: [{ ja: "試験のために頑張る。", ko: "시험을 위해 힘내다." }] },
  { word: "努力", reading: "どりょく", meaning: "노력", meaningDetail: "힘씀", category: "명사", examples: [{ ja: "努力が実を結ぶ。", ko: "노력이 결실을 맺다." }] },
  { word: "成功", reading: "せいこう", meaning: "성공", meaningDetail: "이룸", category: "명사", examples: [{ ja: "事業に成功する。", ko: "사업에 성공하다." }] },
  { word: "失敗", reading: "しっぱい", meaning: "실패", meaningDetail: "잘못됨", category: "명사", examples: [{ ja: "実験に失敗した。", ko: "실험에 실패했다." }] },
  { word: "完成", reading: "かんせい", meaning: "완성", meaningDetail: "마무리", category: "명사", examples: [{ ja: "作品が完成した。", ko: "작품이 완성됐다." }] },
  { word: "達成", reading: "たっせい", meaning: "달성", meaningDetail: "이룸", category: "명사", examples: [{ ja: "目標を達成する。", ko: "목표를 달성하다." }] },
  { word: "実現", reading: "じつげん", meaning: "실현", meaningDetail: "이루어짐", category: "명사", examples: [{ ja: "夢が実現する。", ko: "꿈이 실현되다." }] },
  { word: "解決", reading: "かいけつ", meaning: "해결", meaningDetail: "풀림", category: "명사", examples: [{ ja: "問題を解決する。", ko: "문제를 해결하다." }] },
  { word: "発見", reading: "はっけん", meaning: "발견", meaningDetail: "찾아냄", category: "명사", examples: [{ ja: "新種を発見する。", ko: "신종을 발견하다." }] },
  { word: "発明", reading: "はつめい", meaning: "발명", meaningDetail: "만들어냄", category: "명사", examples: [{ ja: "電話を発明した。", ko: "전화를 발명했다." }] },
  { word: "発表", reading: "はっぴょう", meaning: "발표", meaningDetail: "알림", category: "명사", examples: [{ ja: "研究を発表する。", ko: "연구를 발표하다." }] },
  { word: "発展", reading: "はってん", meaning: "발전", meaningDetail: "성장", category: "명사", examples: [{ ja: "経済が発展する。", ko: "경제가 발전하다." }] },
  { word: "進歩", reading: "しんぽ", meaning: "진보", meaningDetail: "발전", category: "명사", examples: [{ ja: "技術が進歩する。", ko: "기술이 진보하다." }] },
  { word: "改善", reading: "かいぜん", meaning: "개선", meaningDetail: "나아짐", category: "명사", examples: [{ ja: "サービスを改善する。", ko: "서비스를 개선하다." }] },
  { word: "増える", reading: "ふえる", meaning: "늘다", meaningDetail: "증가하다", category: "동사", verbType: "2그룹", examples: [{ ja: "人口が増える。", ko: "인구가 늘다." }] },
  { word: "減る", reading: "へる", meaning: "줄다", meaningDetail: "감소하다", category: "동사", verbType: "1그룹", examples: [{ ja: "体重が減った。", ko: "체중이 줄었다." }] },
  { word: "増やす", reading: "ふやす", meaning: "늘리다", meaningDetail: "증가시키다", category: "동사", verbType: "1그룹", examples: [{ ja: "貯金を増やす。", ko: "저금을 늘리다." }] },
  { word: "減らす", reading: "へらす", meaning: "줄이다", meaningDetail: "감소시키다", category: "동사", verbType: "1그룹", examples: [{ ja: "ゴミを減らす。", ko: "쓰레기를 줄이다." }] },
  { word: "広げる", reading: "ひろげる", meaning: "펼치다", meaningDetail: "넓히다", category: "동사", verbType: "2그룹", examples: [{ ja: "地図を広げる。", ko: "지도를 펼치다." }] },
  { word: "広がる", reading: "ひろがる", meaning: "퍼지다", meaningDetail: "넓어지다", category: "동사", verbType: "1그룹", examples: [{ ja: "噂が広がる。", ko: "소문이 퍼지다." }] },
  { word: "深める", reading: "ふかめる", meaning: "깊게하다", meaningDetail: "심화하다", category: "동사", verbType: "2그룹", examples: [{ ja: "理解を深める。", ko: "이해를 깊게 하다." }] },
  { word: "高める", reading: "たかめる", meaning: "높이다", meaningDetail: "향상시키다", category: "동사", verbType: "2그룹", examples: [{ ja: "能力を高める。", ko: "능력을 높이다." }] },
  { word: "強める", reading: "つよめる", meaning: "강화하다", meaningDetail: "강하게하다", category: "동사", verbType: "2그룹", examples: [{ ja: "警備を強める。", ko: "경비를 강화하다." }] },
  { word: "弱める", reading: "よわめる", meaning: "약화하다", meaningDetail: "약하게하다", category: "동사", verbType: "2그룹", examples: [{ ja: "火を弱める。", ko: "불을 약하게 하다." }] },
  { word: "固める", reading: "かためる", meaning: "굳히다", meaningDetail: "단단히하다", category: "동사", verbType: "2그룹", examples: [{ ja: "決意を固める。", ko: "결의를 굳히다." }] },
  { word: "柔らかくする", reading: "やわらかくする", meaning: "부드럽게하다", meaningDetail: "연하게하다", category: "동사", verbType: "3그룹", examples: [{ ja: "肉を柔らかくする。", ko: "고기를 부드럽게 하다." }] },
  { word: "温める", reading: "あたためる", meaning: "데우다", meaningDetail: "따뜻하게하다", category: "동사", verbType: "2그룹", examples: [{ ja: "料理を温める。", ko: "요리를 데우다." }] },
  { word: "冷やす", reading: "ひやす", meaning: "식히다", meaningDetail: "차갑게하다", category: "동사", verbType: "1그룹", examples: [{ ja: "ビールを冷やす。", ko: "맥주를 식히다." }] },
  { word: "乾かす", reading: "かわかす", meaning: "말리다", meaningDetail: "건조시키다", category: "동사", verbType: "1그룹", examples: [{ ja: "髪を乾かす。", ko: "머리를 말리다." }] },
  { word: "濡らす", reading: "ぬらす", meaning: "적시다", meaningDetail: "젖게하다", category: "동사", verbType: "1그룹", examples: [{ ja: "タオルを濡らす。", ko: "수건을 적시다." }] },
  { word: "汚す", reading: "よごす", meaning: "더럽히다", meaningDetail: "지저분하게하다", category: "동사", verbType: "1그룹", examples: [{ ja: "服を汚す。", ko: "옷을 더럽히다." }] },
  { word: "片付ける", reading: "かたづける", meaning: "정리하다", meaningDetail: "치우다", category: "동사", verbType: "2그룹", examples: [{ ja: "部屋を片付ける。", ko: "방을 정리하다." }] },
  { word: "並べる", reading: "ならべる", meaning: "나열하다", meaningDetail: "줄세우다", category: "동사", verbType: "2그룹", examples: [{ ja: "本を並べる。", ko: "책을 나열하다." }] },
  { word: "並ぶ", reading: "ならぶ", meaning: "줄서다", meaningDetail: "늘어서다", category: "동사", verbType: "1그룹", examples: [{ ja: "列に並ぶ。", ko: "줄에 서다." }] },
  { word: "積む", reading: "つむ", meaning: "쌓다", meaningDetail: "포개다", category: "동사", verbType: "1그룹", examples: [{ ja: "荷物を積む。", ko: "짐을 쌓다." }] },
  { word: "重ねる", reading: "かさねる", meaning: "겹치다", meaningDetail: "포개다", category: "동사", verbType: "2그룹", examples: [{ ja: "紙を重ねる。", ko: "종이를 겹치다." }] },
  { word: "組む", reading: "くむ", meaning: "짜다", meaningDetail: "맞추다", category: "동사", verbType: "1그룹", examples: [{ ja: "チームを組む。", ko: "팀을 짜다." }] },
  { word: "結ぶ", reading: "むすぶ", meaning: "묶다", meaningDetail: "매다", category: "동사", verbType: "1그룹", examples: [{ ja: "靴紐を結ぶ。", ko: "신발끈을 묶다." }] },

  // 형용사 (30개)
  { word: "素晴らしい", reading: "すばらしい", meaning: "훌륭하다", meaningDetail: "뛰어나다", category: "형용사", adjType: "い형용사", examples: [{ ja: "素晴らしい景色だ。", ko: "훌륭한 경치다." }] },
  { word: "素敵", reading: "すてき", meaning: "멋지다", meaningDetail: "근사하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "素敵なドレスだ。", ko: "멋진 드레스다." }] },
  { word: "立派", reading: "りっぱ", meaning: "훌륭하다", meaningDetail: "대단하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "立派な建物だ。", ko: "훌륭한 건물이다." }] },
  { word: "優秀", reading: "ゆうしゅう", meaning: "우수하다", meaningDetail: "뛰어나다", category: "형용사", adjType: "な형용사", examples: [{ ja: "優秀な学生だ。", ko: "우수한 학생이다." }] },
  { word: "適切", reading: "てきせつ", meaning: "적절하다", meaningDetail: "알맞다", category: "형용사", adjType: "な형용사", examples: [{ ja: "適切な対応だ。", ko: "적절한 대응이다." }] },
  { word: "正確", reading: "せいかく", meaning: "정확하다", meaningDetail: "틀림없다", category: "형용사", adjType: "な형용사", examples: [{ ja: "正確な時間だ。", ko: "정확한 시간이다." }] },
  { word: "確実", reading: "かくじつ", meaning: "확실하다", meaningDetail: "틀림없다", category: "형용사", adjType: "な형용사", examples: [{ ja: "確実な情報だ。", ko: "확실한 정보다." }] },
  { word: "明確", reading: "めいかく", meaning: "명확하다", meaningDetail: "분명하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "明確な目標だ。", ko: "명확한 목표다." }] },
  { word: "曖昧", reading: "あいまい", meaning: "애매하다", meaningDetail: "모호하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "曖昧な返事だ。", ko: "애매한 대답이다." }] },
  { word: "複雑", reading: "ふくざつ", meaning: "복잡하다", meaningDetail: "얽히다", category: "형용사", adjType: "な형용사", examples: [{ ja: "複雑な問題だ。", ko: "복잡한 문제다." }] },
  { word: "単純", reading: "たんじゅん", meaning: "단순하다", meaningDetail: "간단하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "単純な作業だ。", ko: "단순한 작업이다." }] },
  { word: "簡単", reading: "かんたん", meaning: "간단하다", meaningDetail: "쉽다", category: "형용사", adjType: "な형용사", examples: [{ ja: "簡単な料理だ。", ko: "간단한 요리다." }] },
  { word: "困難", reading: "こんなん", meaning: "곤란하다", meaningDetail: "어렵다", category: "형용사", adjType: "な형용사", examples: [{ ja: "困難な状況だ。", ko: "곤란한 상황이다." }] },
  { word: "容易", reading: "ようい", meaning: "용이하다", meaningDetail: "쉽다", category: "형용사", adjType: "な형용사", examples: [{ ja: "容易なことではない。", ko: "쉬운 일이 아니다." }] },
  { word: "重要", reading: "じゅうよう", meaning: "중요하다", meaningDetail: "긴요하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "重要な会議だ。", ko: "중요한 회의다." }] },
  { word: "必要", reading: "ひつよう", meaning: "필요하다", meaningDetail: "요구되다", category: "형용사", adjType: "な형용사", examples: [{ ja: "必要な書類だ。", ko: "필요한 서류다." }] },
  { word: "十分", reading: "じゅうぶん", meaning: "충분하다", meaningDetail: "넉넉하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "十分な量だ。", ko: "충분한 양이다." }] },
  { word: "不十分", reading: "ふじゅうぶん", meaning: "불충분하다", meaningDetail: "부족하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "説明が不十分だ。", ko: "설명이 불충분하다." }] },
  { word: "有名", reading: "ゆうめい", meaning: "유명하다", meaningDetail: "알려지다", category: "형용사", adjType: "な형용사", examples: [{ ja: "有名な歌手だ。", ko: "유명한 가수다." }] },
  { word: "無名", reading: "むめい", meaning: "무명", meaningDetail: "알려지지않다", category: "형용사", adjType: "な형용사", examples: [{ ja: "無名の作家だ。", ko: "무명의 작가다." }] },
  { word: "新鮮", reading: "しんせん", meaning: "신선하다", meaningDetail: "싱싱하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "新鮮な野菜だ。", ko: "신선한 야채다." }] },
  { word: "清潔", reading: "せいけつ", meaning: "청결하다", meaningDetail: "깨끗하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "清潔な部屋だ。", ko: "청결한 방이다." }] },
  { word: "不潔", reading: "ふけつ", meaning: "불결하다", meaningDetail: "더럽다", category: "형용사", adjType: "な형용사", examples: [{ ja: "不潔な環境だ。", ko: "불결한 환경이다." }] },
  { word: "快適", reading: "かいてき", meaning: "쾌적하다", meaningDetail: "편하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "快適な生活だ。", ko: "쾌적한 생활이다." }] },
  { word: "不快", reading: "ふかい", meaning: "불쾌하다", meaningDetail: "기분나쁘다", category: "형용사", adjType: "な형용사", examples: [{ ja: "不快な気分だ。", ko: "불쾌한 기분이다." }] },
  { word: "幸福", reading: "こうふく", meaning: "행복하다", meaningDetail: "복되다", category: "형용사", adjType: "な형용사", examples: [{ ja: "幸福な家庭だ。", ko: "행복한 가정이다." }] },
  { word: "不幸", reading: "ふこう", meaning: "불행하다", meaningDetail: "안타깝다", category: "형용사", adjType: "な형용사", examples: [{ ja: "不幸な事故だ。", ko: "불행한 사고다." }] },
  { word: "自由", reading: "じゆう", meaning: "자유롭다", meaningDetail: "구속없다", category: "형용사", adjType: "な형용사", examples: [{ ja: "自由な時間だ。", ko: "자유로운 시간이다." }] },
  { word: "独特", reading: "どくとく", meaning: "독특하다", meaningDetail: "특이하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "独特なスタイルだ。", ko: "독특한 스타일이다." }] },
  { word: "普通", reading: "ふつう", meaning: "보통", meaningDetail: "평범하다", category: "형용사", adjType: "な형용사", examples: [{ ja: "普通の人だ。", ko: "보통 사람이다." }] },

  // 부사 (20개)
  { word: "必ず", reading: "かならず", meaning: "반드시", meaningDetail: "꼭", category: "부사", examples: [{ ja: "必ず来てください。", ko: "반드시 와주세요." }] },
  { word: "絶対", reading: "ぜったい", meaning: "절대", meaningDetail: "반드시", category: "부사", examples: [{ ja: "絶対に許さない。", ko: "절대 용서 안 해." }] },
  { word: "確かに", reading: "たしかに", meaning: "확실히", meaningDetail: "분명히", category: "부사", examples: [{ ja: "確かに聞いた。", ko: "확실히 들었다." }] },
  { word: "恐らく", reading: "おそらく", meaning: "아마", meaningDetail: "추측", category: "부사", examples: [{ ja: "恐らく雨だろう。", ko: "아마 비일 것이다." }] },
  { word: "多分", reading: "たぶん", meaning: "아마", meaningDetail: "짐작", category: "부사", examples: [{ ja: "多分大丈夫だ。", ko: "아마 괜찮을 거다." }] },
  { word: "きっと", reading: "きっと", meaning: "틀림없이", meaningDetail: "분명", category: "부사", examples: [{ ja: "きっと成功する。", ko: "틀림없이 성공할 거다." }] },
  { word: "やはり", reading: "やはり", meaning: "역시", meaningDetail: "과연", category: "부사", examples: [{ ja: "やはり無理だった。", ko: "역시 무리였다." }] },
  { word: "やっぱり", reading: "やっぱり", meaning: "역시", meaningDetail: "아무래도", category: "부사", examples: [{ ja: "やっぱりやめよう。", ko: "역시 그만두자." }] },
  { word: "まさか", reading: "まさか", meaning: "설마", meaningDetail: "그럴리가", category: "부사", examples: [{ ja: "まさか本当?", ko: "설마 진짜?" }] },
  { word: "決して", reading: "けっして", meaning: "결코", meaningDetail: "절대", category: "부사", examples: [{ ja: "決して諦めない。", ko: "결코 포기하지 않는다." }] },
  { word: "全然", reading: "ぜんぜん", meaning: "전혀", meaningDetail: "조금도", category: "부사", examples: [{ ja: "全然わからない。", ko: "전혀 모르겠다." }] },
  { word: "全く", reading: "まったく", meaning: "전혀", meaningDetail: "완전히", category: "부사", examples: [{ ja: "全く同意だ。", ko: "전적으로 동의한다." }] },
  { word: "ほとんど", reading: "ほとんど", meaning: "거의", meaningDetail: "대부분", category: "부사", examples: [{ ja: "ほとんど終わった。", ko: "거의 끝났다." }] },
  { word: "かなり", reading: "かなり", meaning: "꽤", meaningDetail: "상당히", category: "부사", examples: [{ ja: "かなり難しい。", ko: "꽤 어렵다." }] },
  { word: "相当", reading: "そうとう", meaning: "상당히", meaningDetail: "매우", category: "부사", examples: [{ ja: "相当疲れた。", ko: "상당히 피곤하다." }] },
  { word: "非常に", reading: "ひじょうに", meaning: "매우", meaningDetail: "굉장히", category: "부사", examples: [{ ja: "非常に重要だ。", ko: "매우 중요하다." }] },
  { word: "極めて", reading: "きわめて", meaning: "극히", meaningDetail: "대단히", category: "부사", examples: [{ ja: "極めて稀だ。", ko: "극히 드물다." }] },
  { word: "特に", reading: "とくに", meaning: "특히", meaningDetail: "각별히", category: "부사", examples: [{ ja: "特に問題ない。", ko: "특히 문제없다." }] },
  { word: "主に", reading: "おもに", meaning: "주로", meaningDetail: "대체로", category: "부사", examples: [{ ja: "主に日本語を使う。", ko: "주로 일본어를 쓴다." }] },
  { word: "ようやく", reading: "ようやく", meaning: "겨우", meaningDetail: "간신히", category: "부사", examples: [{ ja: "ようやく終わった。", ko: "겨우 끝났다." }] },

  // 비즈니스/사회 관련 (35개)
  { word: "会社", reading: "かいしゃ", meaning: "회사", meaningDetail: "기업", category: "명사", examples: [{ ja: "会社に勤める。", ko: "회사에 다니다." }] },
  { word: "職場", reading: "しょくば", meaning: "직장", meaningDetail: "일터", category: "명사", examples: [{ ja: "職場の雰囲気がいい。", ko: "직장 분위기가 좋다." }] },
  { word: "仕事", reading: "しごと", meaning: "일", meaningDetail: "업무", category: "명사", examples: [{ ja: "仕事が忙しい。", ko: "일이 바쁘다." }] },
  { word: "業務", reading: "ぎょうむ", meaning: "업무", meaningDetail: "직무", category: "명사", examples: [{ ja: "業務を遂行する。", ko: "업무를 수행하다." }] },
  { word: "担当", reading: "たんとう", meaning: "담당", meaningDetail: "맡음", category: "명사", examples: [{ ja: "担当者に聞く。", ko: "담당자에게 묻다." }] },
  { word: "責任", reading: "せきにん", meaning: "책임", meaningDetail: "의무", category: "명사", examples: [{ ja: "責任を取る。", ko: "책임을 지다." }] },
  { word: "義務", reading: "ぎむ", meaning: "의무", meaningDetail: "해야할일", category: "명사", examples: [{ ja: "義務を果たす。", ko: "의무를 다하다." }] },
  { word: "権利", reading: "けんり", meaning: "권리", meaningDetail: "자격", category: "명사", examples: [{ ja: "権利を主張する。", ko: "권리를 주장하다." }] },
  { word: "契約", reading: "けいやく", meaning: "계약", meaningDetail: "약정", category: "명사", examples: [{ ja: "契約を結ぶ。", ko: "계약을 맺다." }] },
  { word: "交渉", reading: "こうしょう", meaning: "교섭", meaningDetail: "협상", category: "명사", examples: [{ ja: "交渉が難航する。", ko: "교섭이 난항이다." }] },
  { word: "取引", reading: "とりひき", meaning: "거래", meaningDetail: "매매", category: "명사", examples: [{ ja: "取引先と会う。", ko: "거래처와 만나다." }] },
  { word: "販売", reading: "はんばい", meaning: "판매", meaningDetail: "팔다", category: "명사", examples: [{ ja: "商品を販売する。", ko: "상품을 판매하다." }] },
  { word: "購入", reading: "こうにゅう", meaning: "구입", meaningDetail: "사들이다", category: "명사", examples: [{ ja: "車を購入する。", ko: "차를 구입하다." }] },
  { word: "支払い", reading: "しはらい", meaning: "지불", meaningDetail: "결제", category: "명사", examples: [{ ja: "支払いを済ませる。", ko: "지불을 끝내다." }] },
  { word: "請求", reading: "せいきゅう", meaning: "청구", meaningDetail: "요구", category: "명사", examples: [{ ja: "請求書を送る。", ko: "청구서를 보내다." }] },
  { word: "収入", reading: "しゅうにゅう", meaning: "수입", meaningDetail: "소득", category: "명사", examples: [{ ja: "収入が増える。", ko: "수입이 늘다." }] },
  { word: "支出", reading: "ししゅつ", meaning: "지출", meaningDetail: "씀", category: "명사", examples: [{ ja: "支出を抑える。", ko: "지출을 줄이다." }] },
  { word: "利益", reading: "りえき", meaning: "이익", meaningDetail: "이윤", category: "명사", examples: [{ ja: "利益を上げる。", ko: "이익을 올리다." }] },
  { word: "損失", reading: "そんしつ", meaning: "손실", meaningDetail: "손해", category: "명사", examples: [{ ja: "損失を被る。", ko: "손실을 입다." }] },
  { word: "投資", reading: "とうし", meaning: "투자", meaningDetail: "자본투입", category: "명사", examples: [{ ja: "株に投資する。", ko: "주식에 투자하다." }] },
  { word: "経営", reading: "けいえい", meaning: "경영", meaningDetail: "운영", category: "명사", examples: [{ ja: "会社を経営する。", ko: "회사를 경영하다." }] },
  { word: "管理", reading: "かんり", meaning: "관리", meaningDetail: "감독", category: "명사", examples: [{ ja: "予算を管理する。", ko: "예산을 관리하다." }] },
  { word: "運営", reading: "うんえい", meaning: "운영", meaningDetail: "경영", category: "명사", examples: [{ ja: "組織を運営する。", ko: "조직을 운영하다." }] },
  { word: "方針", reading: "ほうしん", meaning: "방침", meaningDetail: "정책", category: "명사", examples: [{ ja: "会社の方針に従う。", ko: "회사 방침에 따르다." }] },
  { word: "政策", reading: "せいさく", meaning: "정책", meaningDetail: "시책", category: "명사", examples: [{ ja: "新しい政策を発表する。", ko: "새로운 정책을 발표하다." }] },
  { word: "制度", reading: "せいど", meaning: "제도", meaningDetail: "시스템", category: "명사", examples: [{ ja: "制度を改革する。", ko: "제도를 개혁하다." }] },
  { word: "規則", reading: "きそく", meaning: "규칙", meaningDetail: "법칙", category: "명사", examples: [{ ja: "規則を守る。", ko: "규칙을 지키다." }] },
  { word: "法律", reading: "ほうりつ", meaning: "법률", meaningDetail: "법", category: "명사", examples: [{ ja: "法律に違反する。", ko: "법률을 위반하다." }] },
  { word: "許可", reading: "きょか", meaning: "허가", meaningDetail: "승인", category: "명사", examples: [{ ja: "許可を得る。", ko: "허가를 얻다." }] },
  { word: "承認", reading: "しょうにん", meaning: "승인", meaningDetail: "인정", category: "명사", examples: [{ ja: "承認を求める。", ko: "승인을 구하다." }] },
  { word: "拒否", reading: "きょひ", meaning: "거부", meaningDetail: "거절", category: "명사", examples: [{ ja: "要求を拒否する。", ko: "요구를 거부하다." }] },
  { word: "要求", reading: "ようきゅう", meaning: "요구", meaningDetail: "요청", category: "명사", examples: [{ ja: "要求に応える。", ko: "요구에 응하다." }] },
  { word: "要請", reading: "ようせい", meaning: "요청", meaningDetail: "부탁", category: "명사", examples: [{ ja: "協力を要請する。", ko: "협력을 요청하다." }] },
  { word: "依頼", reading: "いらい", meaning: "의뢰", meaningDetail: "부탁", category: "명사", examples: [{ ja: "仕事を依頼する。", ko: "일을 의뢰하다." }] },
  { word: "提案", reading: "ていあん", meaning: "제안", meaningDetail: "건의", category: "명사", examples: [{ ja: "新しい提案をする。", ko: "새로운 제안을 하다." }] },

  // 자연/환경 관련 (20개)
  { word: "環境", reading: "かんきょう", meaning: "환경", meaningDetail: "주변상황", category: "명사", examples: [{ ja: "環境を守る。", ko: "환경을 지키다." }] },
  { word: "自然", reading: "しぜん", meaning: "자연", meaningDetail: "천연", category: "명사", examples: [{ ja: "自然を楽しむ。", ko: "자연을 즐기다." }] },
  { word: "気候", reading: "きこう", meaning: "기후", meaningDetail: "날씨", category: "명사", examples: [{ ja: "気候が温暖だ。", ko: "기후가 온난하다." }] },
  { word: "温暖化", reading: "おんだんか", meaning: "온난화", meaningDetail: "지구온난화", category: "명사", examples: [{ ja: "地球温暖化が進む。", ko: "지구온난화가 진행되다." }] },
  { word: "汚染", reading: "おせん", meaning: "오염", meaningDetail: "더러움", category: "명사", examples: [{ ja: "大気汚染が深刻だ。", ko: "대기오염이 심각하다." }] },
  { word: "災害", reading: "さいがい", meaning: "재해", meaningDetail: "재난", category: "명사", examples: [{ ja: "災害に備える。", ko: "재해에 대비하다." }] },
  { word: "地震", reading: "じしん", meaning: "지진", meaningDetail: "떨림", category: "명사", examples: [{ ja: "地震が起きた。", ko: "지진이 일어났다." }] },
  { word: "台風", reading: "たいふう", meaning: "태풍", meaningDetail: "폭풍", category: "명사", examples: [{ ja: "台風が接近する。", ko: "태풍이 접근하다." }] },
  { word: "洪水", reading: "こうずい", meaning: "홍수", meaningDetail: "범람", category: "명사", examples: [{ ja: "洪水の被害を受ける。", ko: "홍수 피해를 입다." }] },
  { word: "干ばつ", reading: "かんばつ", meaning: "가뭄", meaningDetail: "건조", category: "명사", examples: [{ ja: "干ばつが続く。", ko: "가뭄이 계속되다." }] },
  { word: "森林", reading: "しんりん", meaning: "삼림", meaningDetail: "숲", category: "명사", examples: [{ ja: "森林を保護する。", ko: "삼림을 보호하다." }] },
  { word: "資源", reading: "しげん", meaning: "자원", meaningDetail: "재료", category: "명사", examples: [{ ja: "資源を節約する。", ko: "자원을 절약하다." }] },
  { word: "エネルギー", reading: "えねるぎー", meaning: "에너지", meaningDetail: "동력", category: "명사", examples: [{ ja: "エネルギーを消費する。", ko: "에너지를 소비하다." }] },
  { word: "電力", reading: "でんりょく", meaning: "전력", meaningDetail: "전기", category: "명사", examples: [{ ja: "電力を供給する。", ko: "전력을 공급하다." }] },
  { word: "原子力", reading: "げんしりょく", meaning: "원자력", meaningDetail: "핵에너지", category: "명사", examples: [{ ja: "原子力発電所。", ko: "원자력 발전소." }] },
  { word: "太陽光", reading: "たいようこう", meaning: "태양광", meaningDetail: "햇빛", category: "명사", examples: [{ ja: "太陽光発電を使う。", ko: "태양광 발전을 쓰다." }] },
  { word: "再生", reading: "さいせい", meaning: "재생", meaningDetail: "다시살림", category: "명사", examples: [{ ja: "資源の再生利用。", ko: "자원의 재생 이용." }] },
  { word: "リサイクル", reading: "りさいくる", meaning: "재활용", meaningDetail: "다시씀", category: "명사", examples: [{ ja: "ゴミをリサイクルする。", ko: "쓰레기를 재활용하다." }] },
  { word: "廃棄", reading: "はいき", meaning: "폐기", meaningDetail: "버림", category: "명사", examples: [{ ja: "廃棄物を処理する。", ko: "폐기물을 처리하다." }] },
  { word: "節約", reading: "せつやく", meaning: "절약", meaningDetail: "아끼다", category: "명사", examples: [{ ja: "電気を節約する。", ko: "전기를 절약하다." }] },

  // 의료/건강 관련 (18개)
  { word: "健康", reading: "けんこう", meaning: "건강", meaningDetail: "튼튼함", category: "명사", examples: [{ ja: "健康に気をつける。", ko: "건강에 신경 쓰다." }] },
  { word: "病気", reading: "びょうき", meaning: "병", meaningDetail: "질환", category: "명사", examples: [{ ja: "病気を治す。", ko: "병을 고치다." }] },
  { word: "症状", reading: "しょうじょう", meaning: "증상", meaningDetail: "현상", category: "명사", examples: [{ ja: "症状が出る。", ko: "증상이 나타나다." }] },
  { word: "診察", reading: "しんさつ", meaning: "진찰", meaningDetail: "검진", category: "명사", examples: [{ ja: "医者に診察してもらう。", ko: "의사에게 진찰받다." }] },
  { word: "治療", reading: "ちりょう", meaning: "치료", meaningDetail: "고침", category: "명사", examples: [{ ja: "治療を受ける。", ko: "치료를 받다." }] },
  { word: "手術", reading: "しゅじゅつ", meaning: "수술", meaningDetail: "오퍼", category: "명사", examples: [{ ja: "手術が成功した。", ko: "수술이 성공했다." }] },
  { word: "入院", reading: "にゅういん", meaning: "입원", meaningDetail: "병원생활", category: "명사", examples: [{ ja: "入院が必要だ。", ko: "입원이 필요하다." }] },
  { word: "退院", reading: "たいいん", meaning: "퇴원", meaningDetail: "퇴원하다", category: "명사", examples: [{ ja: "明日退院する。", ko: "내일 퇴원하다." }] },
  { word: "処方", reading: "しょほう", meaning: "처방", meaningDetail: "약처방", category: "명사", examples: [{ ja: "薬を処方する。", ko: "약을 처방하다." }] },
  { word: "副作用", reading: "ふくさよう", meaning: "부작용", meaningDetail: "부작용", category: "명사", examples: [{ ja: "副作用に注意する。", ko: "부작용에 주의하다." }] },
  { word: "予防", reading: "よぼう", meaning: "예방", meaningDetail: "막음", category: "명사", examples: [{ ja: "病気を予防する。", ko: "병을 예방하다." }] },
  { word: "接種", reading: "せっしゅ", meaning: "접종", meaningDetail: "주사", category: "명사", examples: [{ ja: "ワクチンを接種する。", ko: "백신을 접종하다." }] },
  { word: "感染", reading: "かんせん", meaning: "감염", meaningDetail: "전염", category: "명사", examples: [{ ja: "感染を防ぐ。", ko: "감염을 막다." }] },
  { word: "免疫", reading: "めんえき", meaning: "면역", meaningDetail: "저항력", category: "명사", examples: [{ ja: "免疫力を高める。", ko: "면역력을 높이다." }] },
  { word: "回復", reading: "かいふく", meaning: "회복", meaningDetail: "낫다", category: "명사", examples: [{ ja: "体力が回復する。", ko: "체력이 회복되다." }] },
  { word: "悪化", reading: "あっか", meaning: "악화", meaningDetail: "나빠짐", category: "명사", examples: [{ ja: "症状が悪化する。", ko: "증상이 악화되다." }] },
  { word: "検査", reading: "けんさ", meaning: "검사", meaningDetail: "조사", category: "명사", examples: [{ ja: "血液検査を受ける。", ko: "혈액 검사를 받다." }] },
  { word: "診断", reading: "しんだん", meaning: "진단", meaningDetail: "판정", category: "명사", examples: [{ ja: "診断を下す。", ko: "진단을 내리다." }] },
];

// ID 부여 (n3_w2773부터 시작)
const wordsWithId = newN3Words.map((word, index) => ({
  ...word,
  id: `n3_w${2773 + index}`,
  jlpt: "N3"
}));

// 메인 실행
async function main() {
  const filePath = path.join(__dirname, '../public/data/jlpt_words_detail.json');

  console.log('기존 데이터 로드 중...');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log(`기존 단어 수: ${data.words.length}`);
  console.log(`기존 N3 단어 수: ${data.n3Count}`);

  // 새 단어 추가
  data.words.push(...wordsWithId);

  // 메타데이터 업데이트
  data.n3Count += wordsWithId.length;
  data.totalCount += wordsWithId.length;
  data.lastUpdated = new Date().toISOString().split('T')[0];
  data.version = "2.2.0";

  console.log(`추가된 단어 수: ${wordsWithId.length}`);
  console.log(`새 N3 단어 수: ${data.n3Count}`);
  console.log(`새 총 단어 수: ${data.totalCount}`);

  // 파일 저장
  console.log('파일 저장 중...');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

  console.log('완료!');
}

main().catch(console.error);
