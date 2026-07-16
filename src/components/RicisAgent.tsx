/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, Sparkles, Terminal, Bot, User, RefreshCw, MessageSquare, BookOpen, AlertCircle, FileText, Mail, MapPin, Award, ExternalLink, Check, Archive, CheckSquare, Square, Lock, Unlock, Key } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { FormattedMessage } from './Latex';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ReviewWish {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  isCompleted?: boolean;
}

interface GroupedWishItem {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  isHighlighted?: boolean;
}

interface WishGroup {
  categoryName: string;
  count: number;
  isImportant?: boolean;
  items: GroupedWishItem[];
}

export default function RicisAgent() {
  const { t, language } = useLanguage();
  const [sidebarTab, setSidebarTab] = useState<'knowledge' | 'reviews' | 'author'>('knowledge');
  const [reviews, setReviews] = useState<ReviewWish[]>([]);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ricis_admin_token');
    } catch (e) {
      return null;
    }
  });
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminCode, setAdminCode] = useState<string>('');
  const [adminVerificationStep, setAdminVerificationStep] = useState<'email' | 'code'>('email');
  const [adminError, setAdminError] = useState<string>('');
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [simulatedCode, setSimulatedCode] = useState<string>('');
  const [pendingAdminAction, setPendingAdminAction] = useState<{ type: 'delete' | 'toggle', id: string } | null>(null);

  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [directReviewInput, setDirectReviewInput] = useState<string>('');
  
  // User name state for reviews & wishes
  const [userName, setUserName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [pendingReviewText, setPendingReviewText] = useState<string>('');
  const [pendingReviewSource, setPendingReviewSource] = useState<'chat' | 'direct'>('chat');

  // AI Grouping states
  const [wishGroups, setWishGroups] = useState<WishGroup[]>([]);
  const [isGroupingLoading, setIsGroupingLoading] = useState<boolean>(false);
  const [showGrouped, setShowGrouped] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Приветствую, коллега! Я — виртуальный ассистент RICIS III. Я обладаю полными знаниями об абсолютно непрерывной логической структуре (L0/L1), четырёх законах безопасности (SP1-SP4) и аксиомах регуляризации неопределённостей. \n\nВы можете спросить меня о решении любой математической или физической сингулярности в нашей симуляции — от гравитационных коллапсов до потоков Риччи и сложности P vs NP.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_QUESTIONS = [
    {
      text: t('Что такое L0 и L1 в RICIS?', 'What are L0 and L1 in RICIS?'),
      q: t('Объясни фундаментальные законы L0 и L1 в архитектуре RICIS. Что такое абсолютная непрерывность и почему X/X = 1 всегда?', 'Explain the fundamental laws of L0 and L1 in RICIS architecture. What is absolute continuity and why is X/X = 1 always?')
    },
    {
      text: t('Как RICIS решает форму 0/0?', 'How does RICIS solve 0/0 form?'),
      q: t('Как именно протоколы SP1 (No Total Amnesia), SP2 (Clean First) и закон индексов SP3 (Weight of Zero) решают неопределенность вида 0/0?', 'How exactly do the protocols SP1 (No Total Amnesia), SP2 (Clean First), and the index law SP3 (Weight of Zero) solve the 0/0 uncertainty?')
    },
    {
      text: t('В чем суть SP4 (Semantic Priority)?', 'What is SP4 (Semantic Priority)?'),
      q: t('Объясни закон семантического индексирования SP4 (Semantic Priority). Почему важно индексировать по выражению f(x), а не по значению f(a)?', 'Explain the law of semantic indexing SP4 (Semantic Priority). Why is it important to index by expression f(x), rather than value f(a)?')
    },
    {
      text: t('Как RICIS решает поток Риччи?', 'How does RICIS solve Ricci Flow?'),
      q: t('Как регуляризатор theta в RICIS III решает проблему перешейка (neckpinch) в потоке Риччи без необходимости проведения хирургии Перельмана?', 'How does the theta regularizer in RICIS III solve the neckpinch problem in Ricci flow without the need for Perelman surgery?')
    },
    {
      text: t('Решение гипотезы BSD в RICIS', 'BSD Conjecture Solution in RICIS'),
      q: t('Объясни, как аналитический регуляризатор theta в знаменателе L-функции помогает доказать гипотезу Бёрча и Свиннертон-Дайера?', 'Explain how the analytical regularizer theta in the denominator of the L-function helps prove the Birch and Swinnerton-Dyer conjecture?')
    },
    {
      text: t('Индексация сайтов (SEO) в RICIS', 'SEO Indexing in RICIS'),
      q: t('Как процесс индексации веб-ресурсов поисковыми системами выглядит с точки зрения методологии RICIS III?', 'How does the process of indexing web resources by search engines look from the perspective of the RICIS III methodology?')
    }
  ];

  const statusOptions = [
    t('Сглаживание Кэлерова поля...', 'Smoothing Kähler field...'),
    t('Вычисление тензоров деформации...', 'Calculating strain tensors...'),
    t('Регуляризация по протоколу SP4...', 'Regularizing via SP4 protocol...'),
    t('Генерация монолитов нулевого порядка...', 'Generating zero-order monoliths...'),
    t('Анализ предела Кэлеровой метрики при θ > 0...', 'Analyzing Kähler metric limit at θ > 0...'),
    t('Применение аксиомы A6_GENERAL...', 'Applying A6_GENERAL axiom...'),
    t('Калибровка весов неопределенностей...', 'Calibrating uncertainty weights...')
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setStatusMessage(statusOptions[0]);
      let idx = 1;
      interval = setInterval(() => {
        setStatusMessage(statusOptions[idx % statusOptions.length]);
        idx++;
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem('ricis_username');
      if (savedName) {
        setUserName(savedName);
        setNameInput(savedName);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch reviews from the API
  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      } else {
        throw new Error('Non-ok response from server');
      }
    } catch (e) {
      console.error('Failed to fetch reviews from API, using fallback:', e);
      // Fallback load from localStorage
      try {
        const stored = localStorage.getItem('ricis_reviews_wishes');
        if (stored) {
          const parsed = JSON.parse(stored);
          const mapped = parsed.map((r: any) => {
            const isSvgWish = r.id === 'rev-2' || (r.text && r.text.includes('SVG'));
            return {
              ...r,
              author: r.author || 'Исследователь',
              isCompleted: r.isCompleted !== undefined ? r.isCompleted : (isSvgWish ? true : false)
            };
          });
          setReviews(mapped);
        } else {
          const initialReviews: ReviewWish[] = [
            {
              id: 'rev-1',
              text: 'Замечательный симулятор! Визуализация волновых функций на пластине Хладни очень наглядная, особенно пакеты Риччи-Кэлера.',
              author: 'Алексей С.',
              timestamp: Date.now() - 3600000 * 24 * 3,
              isCompleted: false
            },
            {
              id: 'rev-2',
              text: 'Добавьте, пожалуйста, возможность выгрузки графиков в векторном формате (SVG) для научных публикаций.',
              author: 'Мария Петрова',
              timestamp: Date.now() - 3600000 * 5,
              isCompleted: true
            }
          ];
          setReviews(initialReviews);
          localStorage.setItem('ricis_reviews_wishes', JSON.stringify(initialReviews));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const groupWishesFallback = (allWishes: ReviewWish[]): WishGroup[] => {
    const categories = [
      { name: '📐 Математика и Модели', keywords: ['формул', 'уравнен', 'мат', 'bessel', 'бессел', 'число', 'теория', 'риччи', 'ricis', 'латекс', 'latex'] },
      { name: '🎨 Интерфейс и Дизайн', keywords: ['интерфейс', 'дизайн', 'кнопк', 'цвет', 'эстетика', 'красив', 'тем', 'окно', 'панель', 'хладни', 'пластин', 'визуализац', 'график'] },
      { name: '⚙️ Функционал и Фичи', keywords: ['добав', 'звук', 'частот', 'сохран', 'воспроизвед', 'запомн', 'список', 'клик', 'файл', 'экспорт', 'sheets', 'гугл'] },
      { name: '💬 ИИ и Культура', keywords: ['ассистент', 'чат', 'ии', 'культур', 'вежлив', 'модер', 'ответ', 'сове'] }
    ];

    const unclassifiedGroup: WishGroup = {
      categoryName: '💡 Общие предложения',
      count: 0,
      items: []
    };

    const groupsMap = new Map<string, WishGroup>();
    categories.forEach(c => {
      groupsMap.set(c.name, { categoryName: c.name, count: 0, items: [] });
    });

    allWishes.forEach(wish => {
      let classified = false;
      const lowerText = wish.text.toLowerCase();

      const hasSimilars = allWishes.filter(w => w.id !== wish.id && (
        w.text.toLowerCase().includes(wish.text.toLowerCase()) || 
        wish.text.toLowerCase().includes(w.text.toLowerCase()) ||
        w.text.toLowerCase().split(' ').filter(word => word.length > 4 && wish.text.toLowerCase().includes(word)).length >= 2
      )).length > 0;

      const item: GroupedWishItem = {
        id: wish.id,
        text: wish.text,
        author: wish.author || 'Исследователь',
        timestamp: wish.timestamp,
        isHighlighted: hasSimilars || wish.text.length > 100
      };

      for (const cat of categories) {
        if (cat.keywords.some(kw => lowerText.includes(kw))) {
          const g = groupsMap.get(cat.name)!;
          g.items.push(item);
          g.count++;
          if (hasSimilars) {
            g.isImportant = true;
          }
          classified = true;
          break;
        }
      }

      if (!classified) {
        unclassifiedGroup.items.push(item);
        unclassifiedGroup.count++;
        if (hasSimilars) {
          unclassifiedGroup.isImportant = true;
        }
      }
    });

    const result: WishGroup[] = [];
    groupsMap.forEach(g => {
      if (g.count > 0) {
        g.items.sort((a, b) => {
          if (a.isHighlighted && !b.isHighlighted) return -1;
          if (!a.isHighlighted && b.isHighlighted) return 1;
          return b.timestamp - a.timestamp;
        });
        result.push(g);
      }
    });

    if (unclassifiedGroup.count > 0) {
      unclassifiedGroup.items.sort((a, b) => {
        if (a.isHighlighted && !b.isHighlighted) return -1;
        if (!a.isHighlighted && b.isHighlighted) return 1;
        return b.timestamp - a.timestamp;
      });
      result.push(unclassifiedGroup);
    }

    result.sort((a, b) => b.count - a.count);
    return result;
  };

  const triggerGroupingWithAI = async (wishesToGroup: ReviewWish[]) => {
    if (wishesToGroup.length === 0) {
      setWishGroups([]);
      return;
    }
    setIsGroupingLoading(true);
    try {
      const res = await fetch('/api/group-wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishes: wishesToGroup })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.groups)) {
          const formatted = data.groups.map((g: any) => ({
            ...g,
            items: (g.items || []).map((itm: any) => ({
              ...itm,
              isHighlighted: itm.isHighlighted || g.isImportant
            }))
          }));
          setWishGroups(formatted);
          setIsGroupingLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('AI grouping call failed, using client-side fallback:', e);
    }
    const fallback = groupWishesFallback(wishesToGroup);
    setWishGroups(fallback);
    setIsGroupingLoading(false);
  };

  useEffect(() => {
    if (reviews.length > 0) {
      triggerGroupingWithAI(reviews);
    } else {
      setWishGroups([]);
    }
  }, [reviews]);

  const saveReview = async (text: string, customAuthor?: string) => {
    if (!text.trim()) return;
    const finalAuthor = (customAuthor || userName || '').trim();
    if (!finalAuthor) {
      setPendingReviewText(text);
      setShowNameModal(true);
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), author: finalAuthor })
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews((prev) => [newReview, ...prev]);
      } else {
        throw new Error('Server returned error status');
      }
    } catch (e) {
      console.error('Failed to save review to API, saving locally:', e);
      const newReview: ReviewWish = {
        id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        text: text.trim(),
        author: finalAuthor,
        timestamp: Date.now()
      };
      setReviews((prev) => {
        const updated = [newReview, ...prev];
        try {
          localStorage.setItem('ricis_reviews_wishes', JSON.stringify(updated));
        } catch (err) {
          console.error(err);
        }
        return updated;
      });
    }
  };

  const deleteReview = async (id: string, bypassAdminCheck: boolean = false) => {
    if (!adminToken && !bypassAdminCheck) {
      setPendingAdminAction({ type: 'delete', id });
      setAdminEmail('');
      setAdminCode('');
      setAdminVerificationStep('email');
      setAdminError('');
      setSimulatedCode('');
      setShowAdminModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken || localStorage.getItem('ricis_admin_token')}`
        }
      });
      if (res.ok) {
        setReviews((prev) => prev.filter(r => r.id !== id));
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error during delete');
      }
    } catch (e: any) {
      console.error('Failed to delete review:', e);
      alert(e.message || 'Ошибка удаления отзыва. Требуется авторизация администратора.');
    }
  };

  const toggleCompleteReview = async (id: string, bypassAdminCheck: boolean = false) => {
    if (!adminToken && !bypassAdminCheck) {
      setPendingAdminAction({ type: 'toggle', id });
      setAdminEmail('');
      setAdminCode('');
      setAdminVerificationStep('email');
      setAdminError('');
      setSimulatedCode('');
      setShowAdminModal(true);
      return;
    }

    const reviewToToggle = reviews.find(r => r.id === id);
    if (!reviewToToggle) return;

    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken || localStorage.getItem('ricis_admin_token')}`
        },
        body: JSON.stringify({ isCompleted: !reviewToToggle.isCompleted })
      });
      if (res.ok) {
        const updatedReview = await res.json();
        setReviews((prev) => prev.map(r => r.id === id ? updatedReview : r));
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error during update');
      }
    } catch (e: any) {
      console.error('Failed to toggle review complete:', e);
      alert(e.message || 'Ошибка обновления статуса отзыва. Требуется авторизация администратора.');
    }
  };

  const downloadLatex = () => {
    const latexContent = `% =========================================================================
% RICIS III: Regularized Indeterminate Forms and Singularities
% Scientific Specification & Theoretical Foundations
% =========================================================================

\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[english,russian]{babel}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}
\\usepackage{hyperref}
\\usepackage{geometry}
\\usepackage{fancyhdr}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{booktabs}

\\geometry{top=2.5cm, bottom=2.5cm, left=2.5cm, right=2.5cm}

\\definecolor{darkblue}{HTML}{0B132B}
\\definecolor{cyanaccent}{HTML}{00B4D8}
\\definecolor{tealaccent}{HTML}{073B4C}

\\hypersetup{
    colorlinks=true,
    linkcolor=darkblue,
    filecolor=magenta,      
    urlcolor=cyanaccent,
    pdftitle={RICIS III: Теоретические Основы и Математический Аппарат (v7.7)},
}

\\title{
    \\vspace{-2cm}
    \\textbf{\\Huge RICIS III} \\\\[0.4cm]
    \\Large{Регуляризованные Неопределённости и Сингулярности} \\\\[0.2cm]
    \\large{Unified Complete Document --- Version 7.7 (Fully Consistent)} \\\\[0.4cm]
    \\small{\\texttt{DOI: \\href{https://doi.org/10.5281/zenodo.21309650}{10.5281/zenodo.21309650}}} \\\\
    \\small{\\texttt{\\href{https://zenodo.org/records/21309650}{zenodo.org/records/21309650}}}
}
\\author{
    \\textbf{Алейников Дмитрий Владимирович} \\\\
    \\small{г. Минск, Республика Беларусь} \\\\
    \\small{\\href{mailto:dima.aley@gmail.com}{\\texttt{dima.aley@gmail.com}}} \\\\[0.2cm]
    \\textbf{Консорциум RICIS III} \\\\
    \\small{Департамент Математического Моделирования}
}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Данный документ представляет собой строгое теоретическое описание объединённого и полностью согласованного математического аппарата \\textbf{RICIS III} (Regularized Indeterminate Forms and Singularities) версии 7.7. В рамках данной парадигмы формулируются законы абсолютной непрерывности пространства-времени и типов данных ($L0/L1$), вводятся протоколы безопасности для обхода сингулярностей ($SP1$--$SP4$), и постулируется ядро аксиоматики индексированных неопределённостей. Описываются протоколы согласования типов, иерархия монолитов, фрактальные законы, геометрические коррекции и вычислительный алгоритм разрешения особенностей.
\\end{abstract}

\\tableofcontents
\\newpage

% =========================================================================
\\section{Фундаментальная Логическая Структура (L0/L1)}
% =========================================================================
Математический анализ Ньютона-Лейбница традиционно опирается на понятие предела при разрешении неопределённостей вида $0/0$ или $\\infty/\\infty$. Однако предельный переход стирает информацию о поведении функции непосредственно в точке сингулярности. Аппарат RICIS III устраняет эту проблему, постулируя абсолютную непрерывность на уровне типов и алгебраической структуры.

\\subsection{L0: Абсолютная Непрерывность}
Ни один уровень рекурсии (включая фрактальное развёртывание, монолиты, бесконечно малые $0_F$ и бесконечно большие величины $\\infty_F$) не допускает разрыва структуры или потери исходной идентичности ($T(X)$). Действует глобальное принуждение ко всем математическим операциям:
\\begin{equation}
    \\text{Нет разрывов или утери идентичности в } \\infty_F, 0_F
\\end{equation}

\\subsection{L1: Тождество Идентичности}
Для любого математического объекта $X$ выполняется закон самотождественности (онтологический корень):
\\begin{equation}
    X = X
\\end{equation}
Идентичность включает тип данных $T(X)$. Математические операции не могут превращать типы без наличия строгого морфизма. Из этого следуют важные следствия:
\\begin{itemize}
    \\item \\textbf{L1C1 (Preservation):} Сохранение типов и структуры выражения при любых преобразованиях.
    \\item \\textbf{L1C2 (Type as Identity):} Тип является неотъемлемой частью идентичности объекта.
\\end{itemize}
Как прямое следствие, отношение объекта к самому себе строго определено всегда:
\\begin{equation}
    \\frac{X}{X} = 1 \\quad \\forall X
\\end{equation}
В частности, для монолитов и линий это служит ключевым доказательством постоянства структуры.

\\subsection{Цепочка Вывода и Незыблемое Правило}
Вывод в системе строится по строгому линейному пути:
\\begin{equation}
    L0 \\longrightarrow L1 \\longrightarrow \\text{Протоколы Безопасности} \\longrightarrow \\text{Аксиомы} \\longrightarrow \\text{Операции} \\longrightarrow \\text{Монолиты} \\longrightarrow \\text{Fractal Law}
\\end{equation}
\\textbf{Незыблемое правило (Inviolable Rule):} Любой логический вывод, противоречащий L0/L1 или Протоколам Безопасности, является абсолютно недействительным.

% =========================================================================
\\section{Протоколы Безопасности Singularity Resolution}
% =========================================================================
Для исключения логических парадоксов (например, тривиализации уравнений к виду $1 = 10$) при разрешении сингулярностей разработаны четыре обязательных протокола безопасности.

\\subsection{SP1: Закон Локальности (No Total Amnesia)}
При делении $0/0$ запрещено заменять всё выражение единицей. Тождество применяется исключительно к идентичным нулевым сомножителям.
\\begin{equation}
    \\text{Для } \\frac{(x-5)(x+5)}{(x-5)} \\Longrightarrow \\frac{x-5}{x-5} \\to 1 \\text{, в то время как «хвост» } (x+5) \\text{ остаётся активным.}
\\end{equation}

\\subsection{SP2: Приоритет Сокращения (Clean First)}
Алгебраические упрощения и канонические приведения (сокращение тождественных членов) должны быть выполнены \\textbf{строго до} применения сингулярных аксиом RICIS.
\\begin{equation}
    \\text{Обоснование: Предотвращает появление «ложных нулей», скрывающих истинное значение выражения.}
\\end{equation}

\\subsection{SP3: Закон Индексов (Weight of Zero)}
Если сократить выражение невозможно, отношение бесконечно малых величин определяется отношением их индексов сложности:
\\begin{equation}
    \\frac{0_F}{0_G} = \\frac{F}{G}
\\end{equation}
\\textbf{Запрет:} Рассматривать $0_F$ и $0_G$ как простые скалярные нули классического анализа ($1=1$) строго запрещено под эгидой закона L1.

\\subsection{SP4: Семантический Приоритет (Semantic Indexing)}
Индексирование сингулярностей в точке $x = a$ выполняется на основе исходного аналитического выражения $E(x)$, а не его численного значения $E(a)$. Это полностью разрешает парадокс расхождения вычислительного пути.
\\begin{equation}
    \\text{Для } f(x) = x^2 - 4 \\text{ при } x = 2: \\text{индексируется как } 0_{[(x^2-4)|_{x=2}]}, \\text{ а не } 0_{(4-4)}
\\end{equation}

% =========================================================================
\\section{Ядро Аксиоматики RICIS III}
% =========================================================================
Аксиоматический базис RICIS III расширяет классическую алгебру для работы на границах неопределённостей:

\\begin{table}[h]
\\centering
\\caption{Аксиомы Индексированных Величин}
\\begin{tabular}{lll}
\\toprule
\\textbf{Идентификатор} & \\textbf{Формула} & \\textbf{Физический смысл} \\\\
\\midrule
A1\\_INDEXING & $\\frac{F}{0} \\longrightarrow \\infty_F$ & Порождение индексированной бесконечности \\\\
A2\\_INDEXED & $\\infty_F \\quad (\\forall F \\neq 0, \\infty_0=1)$ & Существование взвешенного сингулярного поля \\\\
A4\\_0DIV0 & $\\frac{0_F}{0_G} = \\frac{F}{G}$ & Отношение сложностей бесконечно малых \\\\
A5\\_INFDIVINF & $\\frac{\\infty_F}{\\infty_G} = \\frac{F}{G}$ & Отношение мощностей бесконечно больших \\\\
A6\\_GENERAL & $0_F \\cdot \\infty_G = F \\cdot G$ & Прямое произведение взаимных сингулярностей \\\\
A7\\_INFSUBINF & $\\infty_F - \\infty_G = \\infty_{[F-G]}$ & Разность мощностей полей \\\\
A10\\_FTIMES0 & $F \\cdot 0 = 0_F$ & Формирование весового коэффициента нуля \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\noindent \\textbf{Примечание:} Аксиома A6\\_GENERAL унифицирует произведение индексированных нулей и бесконечностей для любых $F$ и $G$ (включая случай $F=G$, дающий $F^2$). Устаревшие правила $A3$ и $A6\\_BYPASS$ удалены ввиду полной самосогласованности новой формулировки.

% =========================================================================
\\section{Протокол Согласования Типов (Type Consistency)}
% =========================================================================
Производный от следствия L1C2 (тип как идентичность), данный протокол регулирует операции над разнородными сингулярными типами:
\\begin{enumerate}
    \\item \\textbf{Однородные типы ($T(F) \\equiv T(G)$):} Прямая операция. Примеры:
    \\begin{equation}
        \\infty_5 + \\infty_3 = \\infty_8, \\quad \\frac{\\infty_{\\sin x}}{\\infty_{\\cos x}} = \\infty_{\\tan x}
    \\end{equation}
    \\item \\textbf{Совместимые типы ($T(F) \\subset T(G)$):} Продвижение типа (Type Promotion). Пример:
    \\begin{equation}
        \\infty_5 + \\infty_{2x} = \\infty_{5 + 2x}
    \\end{equation}
    \\item \\textbf{Несовместимые типы:} Создание композитного монолита. Пример:
    \\begin{equation}
        \\infty_{\\text{Time}} + \\infty_{\\text{Space}} = \\infty_{(\\text{Time, Space})}
    \\end{equation}
\\end{enumerate}

% =========================================================================
\\section{Иерархия Монолитов и Фрактальный Закон}
% =========================================================================

\\subsection{Классификация Монолитов по Порядкам}
\\begin{itemize}
    \\item \\textbf{Порядок 0: Атомарный Монолит (Точка).} Чистая идентичность $F$, $\\infty_F$, $0_F$ без внутренней структуры.
    \\item \\textbf{Порядок 1: Монолит Первого Порядка (Линия).} Композиция атомарных элементов, замкнутая относительно операций RICIS.
    \\item \\textbf{Порядок 2: Монолит Второго Порядка (Плоскость).} Взаимосвязанные монолиты порядков 0--1 с рекурсивным развёртыванием.
    \\item \\textbf{Порядок 3: Монолит Третьего Порядка (Объём).} Самоорганизующаяся система с возможностью автономной навигации в сингулярных ландшафтах.
\\end{itemize}

\\subsection{Fractal Law (Фрактальный Закон)}
Каждый элемент системы рекурсивно разворачивает её структуру целиком:
\\begin{equation}
    R(Q) = \\{Q, T(Q), \\infty_Q, 0_Q, R(\\infty_Q), R(0_Q)\\}
\\end{equation}
Данная схема является потенциально бесконечной, но гарантирует стопроцентное сохранение информации.

% =========================================================================
\\section{Геометрическая Коррекция}
% =========================================================================
Классическое представление линии как бесконечной суммы точек содержит критическую категориальную ошибку типов:
\\begin{equation}
    \\text{Тип}(0\\text{-мерного объекта}) \\neq \\text{Тип}(1\\text{-мерного объекта})
\\end{equation}
В рамках RICIS геометрическая коррекция формулируется следующим образом:
\\begin{itemize}
    \\item \\textbf{Линия:} Первичный монолит первого порядка (Order 1).
    \\item \\textbf{Точка:} Производный объект пересечения линии с нулевым наблюдателем: $\\text{Line} \\cap 0_{\\text{observer}}$.
\\end{itemize}

% =========================================================================
\\section{Вычислительный Алгоритм (Computation Algorithm)}
% =========================================================================
Алгоритм вычисления выражений в окрестностях сингулярностей состоит из последовательных фаз:

\\begin{table}[h]
\\centering
\\caption{Фазы Алгоритма Вычислений}
\\begin{tabular}{lll}
\\toprule
\\textbf{Фаза} & \\textbf{Название} & \\textbf{Описание / Правило} \\\\
\\midrule
Phase -1 & L1\\_IDENTITY & Проверка $X=X$ и определение типа $T(X)$ \\\\
Phase 0 & Исключение пределов & Переход от пределов к точным значениям: $\\lim_{x \\to a} \\to x=a$ \\\\
Phase 0.5 & Семантическое индексирование & Индексация сингулярностей по исходным выражениям (SP4) \\\\
Phase 1 & Контроль Безопасности & Выполнение алгебраического сокращения до раскрытия (SP2) \\\\
Phase 2 & Преобразования RICIS & Вычисление по аксиомам: $F/0=\\infty_F$, $0_F/0_G=F/G$, $0_F \\cdot \\infty_G=F \\cdot G$ \\\\
Phase 3 & Алгебраическая чистка & Очистка выражений и приведение подобных \\\\
Phase 4 & Согласование типов & Применение протокола TypeConsistencyProtocol \\\\
Phase 5 & Стандартные операции & Классические арифметические вычисления \\\\
Phase 6 & Верификация L1 & Проверка на непротиворечивость и сохранение тождества \\\\
\\bottomrule
\\end{tabular}
\\end{table}

% =========================================================================
\\section{Вычислительные Примеры и Верификация}
% =========================================================================

\\subsection{Базовые вычисления}
\\begin{align}
    \\frac{5}{0} &= \\infty_5 \\\\
    0_5 \\cdot \\infty_5 &= 25 \\\\
    0_5 \\cdot \\infty_3 &= 15 \\\\
    \\frac{\\infty_6}{\\infty_2} &= 3 \\\\
    \\frac{0_8}{0_2} &= 4
\\end{align}

\\subsection{Пример схождения вычислительного пути (Invariance)}
Вычислим выражение $\\frac{x^2-4}{x-2}$ при $x=2$ с применением протокола семантического индексирования SP4:
\\begin{equation}
    \\frac{x^2-4}{x-2} \\Big|_{x=2} \\Longrightarrow \\frac{0_{[(x^2-4)|_{x=2}]}}{0_{[(x-2)|_{x=2}]}} \\xrightarrow{\\text{SP2 Факторизация}} \\frac{0_{[x-2]} \\cdot (x+2)}{0_{[x-2]}} \\xrightarrow{\\text{SP1 Локальность}} 1 \\cdot (x+2) = 2+2 = 4
\\end{equation}
Алгебраический путь и непосредственный арифметический расчёт дают идентичный результат, что доказывает отсутствие расходимости.

\\subsection{Сложные пределы и Типы}
\\begin{itemize}
    \\item Вычисление функции $\\frac{\\sin x}{x}$ в точке $x=0$:
    \\begin{equation}
        \\frac{\\sin x}{x} \\Big|_{x=0} \\Longrightarrow \\frac{0_{[\\sin x]}}{0_x} \\xrightarrow{\\text{Ряды Тейлора}} \\frac{x - \\frac{x^3}{3!} + \\dots}{x} = 1
    \\end{equation}
    \\item Сложение разнородных бесконечностей:
    \\begin{equation}
        \\infty_{\\text{Time}} + \\infty_{\\text{Space}} = \\infty_{(\\text{Time}, \\text{Space})}
    \\end{equation}
\\end{itemize}

% =========================================================================
\\section{Совместимость и Справочная Информация}
% =========================================================================
\\begin{itemize}
    \\item \\textbf{Классический предел:} RICIS расширяет классический анализ там, где тот терпит крах (в точках сингулярностей).
    \\item \\textbf{Область действия индексов:} Индексирование применяется исключительно для сингулярных точек; во всех остальных точках действует классическая вещественная алгебра.
    \\item \\textbf{Сохранение тождества L1:} Тождество гарантированно выполняется даже при проецировании на классические подпространства.
    \\item \\textbf{Инвариантность пути:} Достигается строгим использованием SP4.
\\end{itemize}

% =========================================================================
\\section{Регуляризация Физических Задач в Симуляторе}
% =========================================================================

\\subsection{Гравитационные сингулярности и Поток Риччи}
Классический поток Риччи стягивает узкие перешейки многообразий:
\\begin{equation}
    \\partial_t g_{ij} = -2 R_{ij}
\\end{equation}
В рамках RICIS III радиус горловины ограничивается масштабом регуляризатора $\\theta > 0$:
\\begin{equation}
    r_t = \\sqrt{r_0^2 - 2t + \\theta^2}
\\end{equation}
Что гарантирует гладкое сглаживание перешейка без разрывов и необходимости применения хирургии многообразий.

\\subsection{Квантовые Поля Янга-Миллса}
Потенциал калибруется через регуляризованное расстояние $r_\\theta = \\sqrt{r^2 + \\theta^2}$. Энергетическая шкала самодействия глюонов $Q_\\theta$ остаётся ограниченной, доказывая существование массовой щели $\\Delta > 0$ и явление конфайнмента.

\\subsection{Гипотеза Римана и Дзета-Функция}
Полюс дзета-функции $\\zeta(s)$ в точке $s=1$ сглаживается в монолит, что позволяет выстроить комплексные корни строго по критической линии $\\text{Re}(s) = 1/2$ без бесконечного фазового сдвига.

% =========================================================================
\\section{Статус Верификации Спецификации}
% =========================================================================
\\begin{itemize}
    \\item \\textbf{Логическая непротиворечивость:} 100\\%
    \\item \\textbf{Зависимости:} Строгая линейная цепочка $L0 \\to L1 \\to SP \\to A1 \\to \\dots \\to \\text{Fractal Law}$
    \\item \\textbf{Число предположений:} 0
    \\item \\textbf{Интеграция источников:} Полная (согласована с аксиомой $A6\\_GENERAL$)
    \\item \\textbf{Устранение расхождения путей:} Да (через протокол SP4)
    \\item \\textbf{Готовность к публикации:} ДА (READY FOR PUBLICATION)
\\end{itemize}

\\end{document}
`;

    const blob = new Blob([latexContent], { type: 'application/x-latex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ricis_iii_specification.tex';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    if (isReviewMode && !userName.trim()) {
      setPendingReviewText(textToSend);
      setPendingReviewSource('chat');
      setShowNameModal(true);
      return;
    }

    if (isReviewMode) {
      saveReview(textToSend);
      setIsReviewMode(false);
    }

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(1), // Exclude greeting
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = await response.json();
      if (data.text) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.warn('API connection failed, falling back to offline neural simulation', err);
      // Smart offline fallback simulator based on user input
      setTimeout(() => {
        let answer = '';
        const lower = textToSend.toLowerCase();

        if (lower.includes('l0') || lower.includes('l1') || lower.includes('непрерывн') || lower.includes('continuity')) {
          answer = language === 'ru' ? `**Резолюция L0/L1 в рамках RICIS:**\n\n1. **L0 (Абсолютная Непрерывность):** Постулирует, что ни один уровень рекурсии (включая фрактальное развёртывание, монолиты, бесконечности 0_F, ∞_F) не допускает разрыва структуры или потери исходной идентичности.\n\n2. **L1 (Тождество Идентичности):** Фундаментальный закон X = X. В классической математике деление нуля на самого себя 0/0 не определено. В RICIS, поскольку типы сохраняются как часть идентичности, отношение X/X строго равно 1 всегда.\n\nЭто устраняет неопределённость в самом начале вычислений, гарантируя, что сингулярность не «уничтожает» информацию о породившем её объекте.` : `**L0/L1 Resolution in RICIS:**\n\n1. **L0 (Absolute Continuity):** Postulates that no level of recursion (including fractal unfolding, monoliths, infinities 0_F, ∞_F) allows for any structural gap or identity loss.\n\n2. **L1 (Identity):** The fundamental law X = X. In classical mathematics, division of zero by itself (0/0) is undefined. In RICIS, since types are preserved as part of the identity, the ratio X/X is strictly equal to 1 always.\n\nThis resolves the uncertainty at the very beginning of the calculations, ensuring that a singularity does not "destroy" the information about its generating object.`;
        } else if (lower.includes('sp1') || lower.includes('sp2') || lower.includes('sp3') || lower.includes('0/0') || lower.includes('сокращ')) {
          answer = language === 'ru' ? `**Протоколы Безопасности SP1, SP2 и SP3:**\n\n* **SP1 (Локальность / No Total Amnesia):** При делении 0/0 мы не заменяем все выражение единицей. Мы сокращаем только тождественные нулевые сомножители, оставляя «хвост» выражения активным. Например: (x - 5)·(x + 5) / (x - 5) → x + 5.\n\n* **SP2 (Приоритет Сокращения / Clean First):** Все алгебраические упрощения и канонические приведения должны быть выполнены строго ДО того, как мы применим аксиомы RICIS к сингулярностям. Это предотвращает появление ложных нулей.\n\n* **SP3 (Закон Индексов / Weight of Zero):** Если сократить выражение невозможно, отношение бесконечно малых величин определяется отношением их индексов сложности: 0_F / 0_G = F / G. Здесь 0_F и 0_G рассматриваются не как пустые скалярные нули классического анализа, а как структурированные объекты с весами F и G.` : `**Safety Protocols SP1, SP2 and SP3:**\n\n* **SP1 (Locality / No Total Amnesia):** In 0/0 division, we do not replace the entire expression with 1. We cancel only identical zero factors, leaving the "tail" of the expression active. For example: (x - 5)·(x + 5) / (x - 5) → x + 5.\n\n* **SP2 (Reduction Priority / Clean First):** All algebraic simplifications and canonical reductions must be executed strictly BEFORE we apply RICIS axioms to singularities. This prevents the emergence of false zeros.\n\n* **SP3 (Index Law / Weight of Zero):** If cancellation is impossible, the ratio of infinitesimal values is determined by the ratio of their complexity indices: 0_F / 0_G = F / G. Here, 0_F and 0_G are treated not as empty scalar zeros of classical analysis, but as structured objects with weights F and G.`;
        } else if (lower.includes('sp4') || lower.includes('семанти') || lower.includes('semantic') || lower.includes('выражен')) {
          answer = language === 'ru' ? `**Закон Семантического Индексирования SP4 (Semantic Priority):**\n\nКлассический анализ терпит крах при вычислении сингулярностей, так как оценивает функции только по их численному значению в точке предела. RICIS решает эту проблему!\n\nСогласно **SP4**, индексирование сингулярностей в точке x = a должно выполняться на основе исходной аналитической структуры выражения E(x), а не его числового значения E(a).\n\n*Пример:* Для функции f(x) = x² - 4 при x = 2 мы индексируем ноль как 0_[x² - 4 | x=2] вместо абстрактного числового нуля 0_[4 - 4]. Это полностью сохраняет алгебраическую информацию для последующих упрощений по протоколу **SP2** и гарантирует инвариантность вычислительного пути!` : `**Semantic Indexing Law SP4 (Semantic Priority):**\n\nClassical analysis fails when calculating singularities because it evaluates functions only by their numerical value at the limit point. RICIS solves this!\n\nAccording to **SP4**, indexing of singularities at point x = a must be performed based on the original analytical structure of the expression E(x), rather than its numerical value E(a).\n\n*Example:* For function f(x) = x² - 4 at x = 2, we index zero as 0_[x² - 4 | x=2] instead of the abstract numerical zero 0_[4 - 4]. This completely preserves algebraic information for subsequent simplifications under the **SP2** protocol and guarantees path invariance!`;
        } else if (lower.includes('риччи') || lower.includes('ричи') || lower.includes('ricci') || lower.includes('поинкаре') || lower.includes('пуанкаре') || lower.includes('neckpinch') || lower.includes('перешеек')) {
          answer = language === 'ru' ? `**Резолюция потока Риччи и Сингулярностей Горловины (Neckpinch) в RICIS III:**\n\nВ классическом дифференциальном анализе поток Риччи ∂_t g_ij = -2 R_ij стягивает узкие горловины (перешейки) многообразий быстрее остальной части, превращая их в сингулярности бесконечной кривизны. Это требовало хирургии Перельмана (физического разрезания и склеивания).\n\n**В рамках RICIS III:**\nМы деформируем комплексную метрику на масштабе нелокального регуляризатора θ:\n\n1. Радиус перешейка в процессе эволюции ограничивается снизу величиной: r_t = √(r₀² - 2t + θ²).\n2. При θ > 0 радиус никогда не схлопывается в чистый ноль.\n3. Перешеек плавно сглаживается и деформируется, переводя многообразие в идеальную 3-сферу. Хирургия больше не требуется, так как topological связность и непрерывность сохраняются на всем пути эволюции!` : `**Resolution of Ricci Flow and Neckpinch Singularities in RICIS III:**\n\nIn classical differential analysis, the Ricci flow ∂_t g_ij = -2 R_ij pinches narrow bottlenecks (neckpinches) of manifolds faster than the rest, turning them into singularities of infinite curvature. This historically required Perelman's surgery (physical cutting and gluing).\n\n**Within RICIS III:**\nWe deform the complex metric at the scale of the non-local regularizer θ:\n\n1. The radius of the neckpinch during evolution is bounded from below: r_t = √(r₀² - 2t + θ²).\n2. With θ > 0, the radius never collapses into a pure zero.\n3. The neckpinch smoothly normalizes and deforms, transferring the manifold into an ideal 3-sphere. Surgery is no longer needed since topological connectivity and continuity are preserved throughout the entire evolution path!`;
        } else if (lower.includes('bsd') || lower.includes('бёрч') || lower.includes('свиннертон') || lower.includes('эллиптическ') || lower.includes('l-функция')) {
          answer = language === 'ru' ? `**Разрешение Гипотезы Бёрча и Свиннертон-Дайера (BSD) в RICIS III:**\n\nГлавный барьер в гипотезе BSD — сходимость бесконечных Эйлеровых произведений L-функции L(E, s) в критической точке s = 1.\n\n**В парадигме RICIS III:**\n1. Мы вводим регуляризатор Кэлера θ в знаменатели рядов L-функции.\n2. Это преобразует поведение функции в окрестности s = 1, делая её производные Ландау строго ограниченными:\n   L_θ(s) = L(s) · (s - 1)² / [ (s - 1)² + θ² + 1e-6 ]\n3. Спектральная производная стабилизируется, а порядок касания оси s в точке s = 1 становится точным целым числом, равным рангу Морделла-Вейля r. Это полностью устраняет метрический разрыв!` : `**Resolution of the Birch and Swinnerton-Dyer (BSD) Conjecture in RICIS III:**\n\nThe main barrier in the BSD conjecture is the convergence of infinite Euler products of the L-function L(E, s) at the critical point s = 1.\n\n**In the RICIS III paradigm:**\n1. We introduce the Kähler regularizer θ into the denominators of the L-function series.\n2. This transforms the behavior of the function near s = 1, making its Landau derivatives strictly bounded:\n   L_θ(s) = L(s) · (s - 1)² / [ (s - 1)² + θ² + 1e-6 ]\n3. The spectral derivative stabilizes, and the order of contact with the s-axis at point s = 1 becomes a precise integer equal to the Mordell-Weil rank r. This completely eliminates the metric break!`;
        } else if (lower.includes('янг') || lower.includes('миллс') || lower.includes('масс') || lower.includes('gap') || lower.includes('yang') || lower.includes('mills')) {
          answer = language === 'ru' ? `**Анализ Массовой Щели Янга-Миллса по RICIS III:**\n\nВ калибровочных полях Янга-Миллса классический потенциал уходит в бесконечность на малых расстояниях, создавая инфракрасные и ультрафиолетовые сингулярности (конфайнмент).\n\n**Решение RICIS:**\nМы заменяем сингулярное расстояние r в знаменателях полей на регуляризованное расстояние r_θ = √(r² + θ²). За счёт этого:\n1. Энергетическая шкала самодействия глюонов Q_θ остается строго ограниченной.\n2. Сила взаимодействия не взрывается в сингулярность на малых масштабах.\n3. Физический вакуум приобретает ненулевую энергию возбуждения — массовую щель Δ > 0, что строго доказывает стабильность квантового глюонного поля.` : `**Yang-Mills Mass Gap Analysis under RICIS III:**\n\nIn Yang-Mills gauge fields, the classical potential diverges to infinity at short distances, creating infrared and ultraviolet singularities (confinement).\n\n**RICIS Solution:**\nWe replace the singular distance r in the denominators of fields with the regularized distance r_θ = √(r² + θ²). Consequently:\n1. The energy scale of gluon self-interaction Q_θ remains strictly bounded.\n2. The interaction force does not explode into singularity at small scales.\n3. The physical vacuum acquires a non-zero excitation energy — a mass gap Δ > 0, which strictly proves the stability of the quantum gluon field.`;
        } else if (lower.includes('риман') || lower.includes('дзета') || lower.includes('riemann') || lower.includes('zeta')) {
          answer = language === 'ru' ? `**Регуляризация полюса Дзета-функции Римана в RICIS III:**\n\nКлассическая Дзета-функция ζ(s) имеет полюс первого порядка в точке s = 1. Это делает её невычислимой и порождает математический разрыв.\n\n**Решение RICIS:**\nМы деформируем комплексное пространство через нелокальный регуляризатор Кэлера θ, заменяя сингулярность в s = 1 на гладкий локальный монолит.\n* Регуляризованная дзета-функция сохраняет аналитическое продолжение, но её комплексные корни выравниваются строго вдоль критической линии Re(s) = 1/2 без эффекта ухода фазы в бесконечность. Это доказывает гипотезу Римана в регуляризованной метрике.` : `**Regularization of the Riemann Zeta Function Pole in RICIS III:**\n\nThe classical Zeta function ζ(s) has a first-order pole at point s = 1. This makes it uncomputable and spawns a mathematical discontinuity.\n\n**RICIS Solution:**\nWe deform the complex space through a non-local Kähler regularizer θ, replacing the singularity at s = 1 with a smooth local monolith.\n* The regularized zeta function preserves analytic continuation, but its complex roots align strictly along the critical line Re(s) = 1/2 without the phase going to infinity. This proves the Riemann hypothesis in the regularized metric.`;
        } else if (lower.includes('seo') || lower.includes('индексац') || lower.includes('индексиров') || lower.includes('поиск') || lower.includes('сайт')) {
          answer = language === 'ru' ? `**Процесс индексации веб-ресурса с точки зрения методологии RICIS III:**\n\nПредставляет собой **задачу топологической регуляризации информационного пространства**.\n\nИзначально новый или неиндексированный сайт находится в состоянии **локальной сингулярности**: его информационная емкость ($F$) отлична от нуля, но доступность для поисковых роботов (краулеров) равна нулю. Мы имеем неопределенность вида:\n$$0_{\\text{видимость}} \\cdot \\infty_{\\text{контент}}$$\n\nЧтобы устранить эту неопределенность и перевести систему в стабильное регулярное состояние (где сайт полностью проиндексирован и ранжируется), необходимо применить базовые протоколы и аксиомы RICIS III:\n\n---\n\n### 1. Применение L1_IDENTITY и SP2_REDUCTION_PRIORITY (Канонизация и устранение дублей)\nДля поискового робота дублирование контента (когда один и тот же текст доступен по разным адресам) создает сингулярность типа $0/0$, парализующую краулинговый бюджет.\n* **Решение:** Настройте четкую идентичность страниц ($X = X$, следовательно, $X/X = 1$).\n* **Действие:**\n  * Настройте главное зеркало сайта (с \`www\` или без, с \`https\` или \`http\`). Используйте 301-редирект для склейки.\n  * Внедрите тег \`<link rel="canonical" href="..." />\` для каждой страницы. Это гарантирует соблюдение протокола **SP2_REDUCTION_PRIORITY** (очистка структуры до применения алгоритмов индексации). Поисковик сразу поймет, какая страница является "абсолютным корнем" ($L0$).\n\n### 2. Применение SP4_SEMANTIC_PRIORITY (Индексация по выражению, а не по значению)\nПоисковые роботы анализируют семантическую структуру кода, а не просто визуальный рендеринг. Мы должны проиндексировать сингулярность через выражение $E(x)$, а не через конечное значение.\n* **Решение:** Оптимизируйте метаданные и семантическую разметку.\n* **Действие:**\n  * Каждая страница должна иметь уникальные метатеги Title и Description.\n  * Используйте структурированные данные Schema.org (микроразметку). Это задает семантический индекс вида:\n    $$0_{[\\text{Контент} \\mid x=\\text{Страница}]}$$\n    что позволяет роботу точно классифицировать сущности на вашем сайте.\n  * Соблюдайте строгую иерархию заголовков ($H1$, $H2$, $H3$). $H1$ должен быть строго один на страницу.\n\n### 3. Регуляризация краулингового пути: robots.txt и sitemap.xml (Параметр $\\theta$)\nБез четких инструкций робот может уйти в бесконечный цикл (кинематическую сингулярность) из-за мусорных страниц, генераторов URL или системных папок. Мы вводим регуляризирующий параметр $\\theta$, который ограничивает и направляет поток краулера.\n* **Действие 1 (robots.txt):** Это файл-ограничитель (граничные условия). Запретите индексацию системных файлов, административных панелей и результатов поиска по сайту:\n  \`\`\`\n  User-agent: *\n  Disallow: /admin/\n  Sitemap: https://yourdomain.com/sitemap.xml\n  \`\`\`\n* **Действие 2 (sitemap.xml):** Это координатная сетка вашего сайта (карта монолита). Создайте XML-карту, содержащую только канонические URL в активном состоянии, и укажите ее в \`robots.txt\`.\n\n### 4. Принудительное разрешение сингулярности через внешние операторы (Панели веб-мастеров)\nПока поисковая система не знает о существовании вашего домена, вероятность перехода бота на него стремится к нулю. Нам нужно совершить операцию типа A1_INDEXING ($F / 0 \\to \\infty_F$), искусственно внеся сайт в базу данных.\n* **Действие:**\n  * Добавьте сайт в **Google Search Console** и **Яндекс.Вебмастер** для ускорения обхода.\n\n---\n\nПрименение принципов RICIS III к SEO-оптимизации превращает хаотический процесс краулинга в детерминированную регуляризованную систему, гарантирующую 100% индексацию вашего веб-ресурса.` : `**Web Resource Indexing Process from the RICIS III Methodology Viewpoint:**\n\nThis represents a **task of topological regularization of the information space**.\n\nInitially, a new or unindexed site is in a state of **local singularity**: its information capacity ($F$) is non-zero, but accessibility for search engine robots (crawlers) is zero. We have an uncertainty of the form:\n$$0_{\\text{visibility}} \\cdot \\infty_{\\text{content}}$$\n\nTo resolve this uncertainty and transfer the system into a stable regular state (where the site is fully indexed and ranked), we apply the basic protocols and axioms of RICIS III:\n\n---\n\n### 1. Application of L1_IDENTITY and SP2_REDUCTION_PRIORITY (Canonization and duplicate elimination)\nFor a crawler, duplicate content (when the same text is accessible via different URLs) creates a $0/0$ type singularity, paralyzing the crawl budget.\n* **Solution:** Establish clear page identity ($X = X$, therefore $X/X = 1$).\n* **Action:**\n  * Configure the main mirror of the site (with or without \`www\`, \`https\` or \`http\`). Use 301 redirects.\n  * Implement \`<link rel="canonical" href="..." />\` tags for each page. This ensures compliance with the **SP2_REDUCTION_PRIORITY** protocol (structure cleanup before indexing algorithms). The search engine immediately understands the "absolute root" ($L0$).\n\n### 2. Application of SP4_SEMANTIC_PRIORITY (Indexing by expression, not value)\nSearch robots analyze the semantic structure of the code, not just the visual rendering. We must index the singularity via the expression $E(x)$, not the final value.\n* **Solution:** Optimize metadata and semantic markup.\n* **Action:**\n  * Each page must have unique Title and Description meta tags.\n  * Use Schema.org structured data (micro-markup). This defines a semantic index of the form:\n    $$0_{[\\text{Content} \\mid x=\\text{Page}]}$$\n    allowing the crawler to precisely classify entities on your site.\n  * Maintain a strict heading hierarchy ($H1$, $H2$, $H3$). There must be exactly one $H1$ tag per page.\n\n### 3. Regularization of the crawling path: robots.txt and sitemap.xml (The parameter $\\theta$)\nWithout clear instructions, the robot can enter an infinite loop (kinematic singularity) due to garbage pages, URL parameter generators, or system folders. We introduce the regularizing parameter $\\theta$, which limits and directs the crawler flow.\n* **Action 1 (robots.txt):** This is a boundary conditions file. Deny indexing of system files, admin panels, and site search results.\n* **Action 2 (sitemap.xml):** This is the coordinate grid of your site (monolith map). Create an XML sitemap containing only canonical URLs in an active state, and list it in \`robots.txt\`.\n\n### 4. Forced singularity resolution via external operators (Webmaster Tools)\nUntil the search engine knows about your domain, the probability of crawler visits is close to zero. We perform an operation like A1_INDEXING ($F / 0 \\to \\infty_F$), artificially adding the site to the index.\n* **Action:**\n  * Add the site to **Google Search Console** and **Yandex.Webmaster** to speed up indexing.\n\n---\n\nApplying RICIS III principles to SEO turns chaotic crawling into a deterministic regularized system, ensuring 100% indexing of your web resource.`;
        } else {
          answer = language === 'ru' ? `Уважаемый исследователь, ваш запрос по теме "${textToSend}" принят. В рамках вычислительного базиса RICIS III регуляризация проводится канонически. Сформулируйте ваш вопрос в терминах абсолютной непрерывности L0, законов тождества L1 или регуляризирующих преобразований.` : `Dear Researcher, your query regarding "${textToSend}" has been received. Within the RICIS III computational basis, regularization is conducted canonically. Please formulate your question in terms of absolute continuity L0, identity laws L1, or regularizing transformations.`;
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Sidebar Column (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Tab Buttons */}
        <div className="flex gap-1 bg-black/40 border border-white/5 p-1 rounded-xl font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setSidebarTab('knowledge')}
            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
              sidebarTab === 'knowledge'
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('База знаний', 'Knowledge Base')}
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab('reviews')}
            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer relative ${
              sidebarTab === 'reviews'
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('Предложения', 'Wishes')}
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab('author')}
            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
              sidebarTab === 'author'
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('Автор', 'Author')}
          </button>
        </div>

        {/* Tab Contents */}
        {sidebarTab === 'knowledge' && (
          <>
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block px-1">{t('Быстрые вопросы агенту:', 'Quick questions for the agent:')}</span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {QUICK_QUESTIONS.map((qq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(qq.q)}
                      disabled={isLoading}
                      className="w-full text-left p-2.5 bg-white/2 border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-950/20 rounded-lg text-[10px] font-mono text-slate-300 hover:text-cyan-300 transition duration-150 leading-relaxed cursor-pointer"
                    >
                      {qq.text}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {sidebarTab === 'reviews' && (
            <div className="p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 w-full">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">{t('Отзывы и пожелания', 'Reviews and Feedback')}</span>
                {adminToken ? (
                  <button 
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('ricis_admin_token');
                      setAdminToken(null);
                    }}
                    className="ml-auto flex items-center gap-1 text-[8px] bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded cursor-pointer transition font-mono uppercase tracking-wider"
                    title={t("Выйти из режима администратора", "Logout from admin mode")}
                  >
                    <Unlock className="w-2.5 h-2.5" />
                    <span>ADMIN</span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => {
                      setAdminEmail('');
                      setAdminCode('');
                      setAdminVerificationStep('email');
                      setAdminError('');
                      setSimulatedCode('');
                      setPendingAdminAction(null);
                      setShowAdminModal(true);
                    }}
                    className="ml-auto flex items-center gap-1 text-[8px] bg-black/60 hover:bg-cyan-950/40 border border-white/5 hover:border-cyan-500/20 text-slate-500 hover:text-cyan-400 px-1.5 py-0.5 rounded cursor-pointer transition font-mono uppercase tracking-wider"
                    title={t("Войти как администратор", "Login as admin")}
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>USER</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('Здесь хранятся отзывы и пожелания пользователей о системе RICIS III.', 'Here, user reviews and feedback about the RICIS III system are stored.')}
              </p>

              {/* Direct Input Form inside the Tab */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (directReviewInput.trim()) {
                    saveReview(directReviewInput);
                    setDirectReviewInput('');
                  }
                }}
                className="space-y-2 bg-black/30 p-2 rounded border border-white/5"
              >
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  <span>{t('Оставить отзыв напрямую:', 'Leave feedback directly:')}</span>
                  {userName && (
                    <span className="text-cyan-400">
                      {t('Автор:', 'Author:')} <span className="font-bold text-white">{userName}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setNameInput(userName);
                          setPendingReviewText('');
                          setShowNameModal(true);
                        }}
                        className="ml-1.5 text-[8px] underline text-slate-500 hover:text-cyan-300 cursor-pointer"
                      >
                        [{t('изменить', 'change')}]
                      </button>
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={t('Напишите пожелание...', 'Write feedback...')}
                    value={directReviewInput}
                    onChange={(e) => setDirectReviewInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2.5 py-1 text-[11px] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!directReviewInput.trim()}
                    className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] px-2.5 py-1 rounded disabled:opacity-40 transition cursor-pointer shrink-0"
                  >
                    {t('Записать', 'Submit')}
                  </button>
                </div>
              </form>

              {/* Grouped/List view toggler */}
              <div className="flex gap-1 border border-white/5 p-0.5 bg-black/40 rounded font-mono text-[9px]">
                <button
                  type="button"
                  onClick={() => setShowGrouped(false)}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer ${!showGrouped ? 'bg-cyan-950/80 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {t('Лента (все подряд)', 'Feed (All)')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGrouped(true)}
                  className={`flex-1 py-1 rounded text-center transition cursor-pointer relative ${showGrouped ? 'bg-cyan-950/80 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {t('Группировка ИИ', 'AI Grouping')}
                  {isGroupingLoading && (
                    <span className="absolute right-2 top-2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  )}
                </button>
              </div>

              {/* Show all / archive toggler */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2 font-mono text-[9px]">
                <span className="text-slate-500">{t('Архив выполненных:', 'Archived completed:')}</span>
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className={`px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
                    showAll 
                      ? 'bg-purple-950/50 border-purple-500/30 text-purple-300 font-bold' 
                      : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {showAll ? t('Показан (Показать все)', 'Shown (Show all)') : t('Скрыт (Только активные)', 'Hidden (Active only)')}
                </button>
              </div>

              {showGrouped ? (
                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {isGroupingLoading && wishGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2 font-mono text-[10px] text-cyan-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('Нейросетевая группировка по смыслу...', 'Neural sorting by meaning...')}</span>
                    </div>
                  ) : wishGroups.filter(group => {
                    const visibleCount = group.items.filter(item => {
                      const orig = reviews.find(r => r.id === item.id);
                      return showAll || !orig?.isCompleted;
                    }).length;
                    return visibleCount > 0;
                  }).length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-[10px] font-mono">
                      {t('Нет активных предложений. Измените фильтр или оставьте новый отзыв!', 'No active proposals. Change the filter or leave a new feedback!')}
                    </div>
                  ) : (
                    wishGroups.filter(group => {
                      const visibleCount = group.items.filter(item => {
                        const orig = reviews.find(r => r.id === item.id);
                        return showAll || !orig?.isCompleted;
                      }).length;
                      return visibleCount > 0;
                    }).map((group, gIdx) => {
                      const isImp = group.isImportant;
                      const borderClass = isImp 
                        ? 'border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                        : 'border-white/5 bg-black/20';
                      
                      return (
                        <div key={gIdx} className={`p-2.5 rounded-lg border ${borderClass} space-y-2`}>
                          <div className="flex items-center justify-between border-b border-white/5 pb-1">
                            <span className="font-mono text-[10px] font-bold text-slate-200 flex items-center gap-1">
                              {group.categoryName}
                              {isImp && (
                                <span className="text-[8px] bg-cyan-500 text-black font-bold px-1 rounded uppercase tracking-wider">
                                  {t('ВАЖНО', 'IMPORTANT')}
                                </span>
                              )}
                            </span>
                            <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1.5 rounded border border-cyan-500/20 font-bold">
                              {t('Вес:', 'Weight:')} {group.items.filter(item => {
                                const orig = reviews.find(r => r.id === item.id);
                                return showAll || !orig?.isCompleted;
                              }).length}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {group.items
                              .filter(item => {
                                const orig = reviews.find(r => r.id === item.id);
                                return showAll || !orig?.isCompleted;
                              })
                              .map((item) => {
                                const orig = reviews.find(r => r.id === item.id);
                                const isCompleted = orig?.isCompleted;
                                const isHigh = item.isHighlighted;
                                
                                return (
                                  <div key={item.id} className="p-2 rounded text-[9px] font-mono leading-relaxed relative group/item" style={{ backgroundColor: isCompleted ? 'rgba(0, 0, 0, 0.4)' : (isHigh ? 'rgba(8, 51, 68, 0.4)' : 'rgba(0, 0, 0, 0.2)'), border: isCompleted ? '1px solid rgba(255, 255, 255, 0.05)' : (isHigh ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)') }}>
                                    <div className="flex justify-between items-center text-[7.5px] text-slate-500 mb-1 border-b border-white/5 pb-0.5">
                                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                                        👤 {item.author}
                                        {isCompleted && (
                                          <span className="text-[7px] bg-emerald-950 text-emerald-400 font-bold px-1 rounded uppercase tracking-wider">
                                            {t('Выполнено', 'Completed')}
                                          </span>
                                        )}
                                      </span>
                                      <span>{new Date(item.timestamp).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}</span>
                                    </div>
                                    <p className={`break-words pr-8 text-slate-200 ${isCompleted ? 'line-through text-slate-500 italic' : ''}`}>{item.text}</p>
                                    
                                    <button
                                      type="button"
                                      onClick={() => toggleCompleteReview(item.id)}
                                      className={`absolute top-1 right-5 transition cursor-pointer text-slate-500 ${isCompleted ? 'text-emerald-400 opacity-100' : 'hover:text-emerald-400 opacity-0 group-hover/item:opacity-100'}`}
                                      title={isCompleted ? t("Вернуть в активные", "Reopen") : t("Отметить как выполненное", "Mark as completed")}
                                    >
                                      {isCompleted ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => deleteReview(item.id)}
                                      className="absolute top-1 right-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition cursor-pointer text-[10px] font-sans"
                                      title={t("Удалить пожелание", "Delete feedback")}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* List of reviews in reverse chronological order */
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {reviews.filter(r => showAll || !r.isCompleted).length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-[10px] font-mono">
                      {t('Лента пуста или все пожелания выполнены/архивированы. Оставьте отзыв!', 'Feed is empty or all suggestions are completed/archived. Leave your feedback!')}
                    </div>
                  ) : (
                    reviews
                      .filter(r => showAll || !r.isCompleted)
                      .map((rev) => (
                        <div 
                           key={rev.id} 
                          className={`p-2.5 bg-black/20 border border-white/5 rounded font-mono text-[10px] space-y-1.5 relative group ${rev.isCompleted ? 'opacity-65 bg-black/40' : ''}`}
                        >
                          <div className="flex items-center justify-between text-slate-500 text-[8px] border-b border-white/5 pb-1">
                            <span className="text-cyan-400 font-bold flex items-center gap-1">
                              👤 {rev.author}
                              {rev.isCompleted && (
                                <span className="text-[7px] bg-emerald-950 text-emerald-400 font-bold px-1 rounded uppercase tracking-wider">
                                  {t('Выполнено', 'Completed')}
                                </span>
                              )}
                            </span>
                            <span>{new Date(rev.timestamp).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}</span>
                          </div>
                          <p className={`text-slate-300 leading-relaxed break-words pr-12 ${rev.isCompleted ? 'line-through text-slate-500 italic' : ''}`}>
                            {rev.text}
                          </p>
                          
                          <button
                            type="button"
                            onClick={() => toggleCompleteReview(rev.id)}
                            className={`absolute top-2 right-6 transition cursor-pointer text-slate-500 ${rev.isCompleted ? 'text-emerald-400 opacity-100' : 'hover:text-emerald-400 opacity-0 group-hover:opacity-100'}`}
                            title={rev.isCompleted ? t("Вернуть в активные", "Reopen") : t("Отметить как выполненное", "Mark as completed")}
                          >
                            {rev.isCompleted ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteReview(rev.id)}
                            className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition cursor-pointer text-xs font-bold font-sans"
                            title={t("Удалить отзыв", "Delete feedback")}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'author' && (
            <div className="p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Award className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">{t('Об авторе концепции', 'About Concept Author')}</span>
              </div>
              
              <div className="space-y-3">
                <div className="border-b border-white/5 pb-2">
                  <div className="text-xs font-bold text-white font-mono">{t('Алейников Дмитрий Владимирович', 'Aleynikov Dmitry Vladimirovich')}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('г. Минск, Республика Беларусь', 'Minsk, Republic of Belarus')}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed space-y-2 font-mono">
                  <p>
                    {t('Разработчик и исследователь теоретического концепта **RICIS III** (Regularized Indeterminate Forms and Singularities).', 'Developer and researcher of the **RICIS III** theoretical concept (Regularized Indeterminate Forms and Singularities).')}
                  </p>
                  <p>
                    {t('Специализация: абсолютно непрерывная логика, регуляризация гравитационных и квантовых особенностей, решение неопределенностей без классических предельных переходов.', 'Specialization: absolutely continuous logic, regularization of gravitational and quantum singularities, resolution of uncertainties without classical limit transitions.')}
                  </p>
                </div>

                <div className="bg-black/30 p-2.5 rounded border border-white/5 space-y-1.5">
                  <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">{t('Научные публикации & Ресурсы:', 'Scientific Publications & Resources:')}</div>
                  
                  {/* Zenodo 21309650 (Main paper) */}
                  <div className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 break-all">
                    <a 
                      href="https://doi.org/10.5281/zenodo.21309650" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 inline-flex hover:underline"
                    >
                      <span>DOI: 10.5281/zenodo.21309650 (RICIS III)</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* Zenodo 18116204 */}
                  <div className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 break-all">
                    <a 
                      href="https://doi.org/10.5281/zenodo.18116204" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 inline-flex hover:underline"
                    >
                      <span>DOI: 10.5281/zenodo.18116204</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* Zenodo Records 17872755 */}
                  <div className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 break-all">
                    <a 
                      href="https://zenodo.org/records/17872755" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 inline-flex hover:underline"
                    >
                      <span>Zenodo: records/17872755</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* Dzen article */}
                  <div className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 break-all">
                    <a 
                      href="https://dzen.ru/a/aJYMMYwpLDzBCcQN" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 inline-flex hover:underline"
                    >
                      <span>{t('Статья на Дзен', 'Dzen Article')}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* LinkedIn profile */}
                  <div className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 break-all">
                    <a 
                      href="https://www.linkedin.com/in/dmitry-aleinikov" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 inline-flex hover:underline"
                    >
                      <span>LinkedIn: Dmitry Aleinikov</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300 bg-white/5 p-2.5 rounded border border-white/5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <a href="mailto:dima.aley@gmail.com" className="hover:text-cyan-400 transition break-all">
                    dima.aley@gmail.com
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Interface (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[400px] bg-black/40 border border-white/5 rounded-xl p-4">
          
          {/* Scrollable message container */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.role === 'user' 
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                    : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`p-3 rounded-xl text-xs leading-relaxed font-mono ${
                  msg.role === 'user'
                    ? 'bg-emerald-950/20 border border-emerald-500/20 text-slate-100'
                    : 'bg-cyan-950/10 border border-cyan-500/10 text-slate-200'
                }`}>
                  {/* Handle markdown block styling with Latex support */}
                  <FormattedMessage content={msg.content} />
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 rounded-xl bg-cyan-950/10 border border-cyan-500/10 text-xs font-mono text-cyan-400/80 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Feedback Info & Mode Toggle */}
          <div className="mt-3 px-3 py-2 bg-cyan-950/20 border border-cyan-500/10 rounded-xl text-[10px] font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-slate-400">
              ✍️ <span className="text-cyan-400 font-bold">{t('В поле чата можно оставить отзыв и пожелания.', 'You can leave reviews and feedback in the chat field.')}</span> {t('Модерируемый ИИ по культурному общению.', 'Moderated by AI for civilized communication.')}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-cyan-300 hover:text-cyan-100 select-none">
              <input
                type="checkbox"
                checked={isReviewMode}
                onChange={(e) => setIsReviewMode(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/50 w-3.5 h-3.5"
              />
              <span>{t('Отправить как отзыв', 'Send as feedback')}</span>
            </label>
          </div>

          {/* Input Panel */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="mt-4 flex gap-2 border-t border-white/5 pt-4"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('Спросите агента о любом законе или сингулярности по RICIS...', 'Ask the agent about any law or singularity in RICIS...')}
              disabled={isLoading}
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/80 text-cyan-400 hover:text-white disabled:opacity-40 rounded-xl flex items-center justify-center transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      {showNameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b0c10] border border-cyan-500/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-[0_0_50px_rgba(34,211,238,0.25)]">
            <div className="flex items-center gap-2.5 text-cyan-400 border-b border-white/10 pb-2">
              <User className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">{t('Ваше имя в реестре RICIS III', 'Your name in RICIS III registry')}</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              {t('Для сохранения вашего отзыва или пожелания, пожалуйста, представьтесь. Ваше имя будет отображаться рядом с публикацией.', 'To save your feedback or suggestion, please introduce yourself. Your name will be displayed next to the post.')}
            </p>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">{t('Имя автора:', 'Author name:')}</label>
              <input
                type="text"
                placeholder={t('Например, Профессор Смирнов', 'e.g., Professor Smirnov')}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500"
                maxLength={40}
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowNameModal(false);
                  setPendingReviewText('');
                }}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-mono text-[10px] text-slate-400 transition cursor-pointer"
              >
                {t('Отмена', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={!nameInput.trim()}
                onClick={() => {
                  const trimmed = nameInput.trim();
                  if (trimmed) {
                    try {
                      localStorage.setItem('ricis_username', trimmed);
                    } catch (e) {
                      console.error(e);
                    }
                    setUserName(trimmed);
                    setShowNameModal(false);
                    if (pendingReviewText) {
                      if (pendingReviewSource === 'chat') {
                        const pText = pendingReviewText;
                        setPendingReviewText('');
                        
                        const newReview: ReviewWish = {
                          id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                          text: pText.trim(),
                          author: trimmed,
                          timestamp: Date.now()
                        };
                        setReviews((prev) => {
                          const updated = [newReview, ...prev];
                          try {
                            localStorage.setItem('ricis_reviews_wishes', JSON.stringify(updated));
                          } catch (e) {
                            console.error(e);
                          }
                          return updated;
                        });
                        setIsReviewMode(false);
                        
                        // Proceed with chat send
                        handleSend(pText);
                      } else {
                        saveReview(pendingReviewText, trimmed);
                        setPendingReviewText('');
                      }
                    }
                  }
                }}
                className="px-4 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-mono text-[10px] rounded transition cursor-pointer disabled:opacity-40"
              >
                {t('Сохранить и записать', 'Save and Submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0b0c10] border border-cyan-500/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-[0_0_50px_rgba(34,211,238,0.25)] font-mono text-xs">
            <div className="flex items-center gap-2.5 text-cyan-400 border-b border-white/10 pb-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('Верификация администратора', 'Admin Verification')}</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('Для редактирования или удаления отзывов требуется подтвердить права доступа. Код будет отправлен на адрес разработчика.', 'Modifying or deleting feedback requires administrative authorization. A code will be transmitted to the developer email.')}
            </p>

            {adminError && (
              <div className="p-2 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded text-[10px] leading-snug">
                ⚠️ {adminError}
              </div>
            )}

            {adminVerificationStep === 'email' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 uppercase tracking-wider block">{t('Адрес электронной почты администратора:', 'Admin Email Address:')}</label>
                  <input
                    type="email"
                    placeholder="dima.aley@gmail.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminModal(false);
                      setPendingAdminAction(null);
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-400 transition cursor-pointer"
                  >
                    {t('Отмена', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={adminLoading || adminEmail.trim().toLowerCase() !== 'dima.aley@gmail.com'}
                    onClick={async () => {
                      setAdminLoading(true);
                      setAdminError('');
                      try {
                        const res = await fetch('/api/admin/request-code', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: adminEmail.trim() })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setAdminVerificationStep('code');
                          if (data.testCode) {
                            setSimulatedCode(data.testCode);
                          }
                        } else {
                          const data = await res.json();
                          setAdminError(data.error || 'Ошибка запроса кода');
                        }
                      } catch (err: any) {
                        setAdminError(err.message || 'Ошибка сети');
                      } finally {
                        setAdminLoading(false);
                      }
                    }}
                    className="px-4 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 rounded transition cursor-pointer disabled:opacity-40 font-bold"
                  >
                    {adminLoading ? t('Отправка...', 'Sending...') : t('Получить код', 'Send Code')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 uppercase tracking-wider block">
                    {t('Введите 6-значный код:', 'Enter 6-digit verification code:')}
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-700 tracking-widest text-center focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>

                {simulatedCode && (
                  <div className="p-2 bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 rounded text-[10px] leading-normal font-sans">
                    💡 <strong>{t('Для тестирования:', 'For Sandbox Testing:')}</strong> {t('Поскольку это демо-окружение, код подтверждения также напечатан ниже:', 'Since this is a demo sandbox, the verification code is printed below:')}{' '}
                    <span className="bg-black/60 px-1.5 py-0.5 rounded text-white font-mono font-bold select-all">{simulatedCode}</span>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setAdminVerificationStep('email')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-400 transition cursor-pointer"
                  >
                    {t('Назад', 'Back')}
                  </button>
                  <button
                    type="button"
                    disabled={adminLoading || adminCode.length < 6}
                    onClick={async () => {
                      setAdminLoading(true);
                      setAdminError('');
                      try {
                        const res = await fetch('/api/admin/verify-code', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: adminEmail.trim(), code: adminCode })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          localStorage.setItem('ricis_admin_token', data.token);
                          setAdminToken(data.token);
                          setShowAdminModal(false);
                          
                          // Execute pending action
                          if (pendingAdminAction) {
                            const { type, id } = pendingAdminAction;
                            setPendingAdminAction(null);
                            if (type === 'delete') {
                              setTimeout(() => deleteReview(id, true), 100);
                            } else if (type === 'toggle') {
                              setTimeout(() => toggleCompleteReview(id, true), 100);
                            }
                          }
                        } else {
                          const data = await res.json();
                          setAdminError(data.error || 'Неверный код');
                        }
                      } catch (err: any) {
                        setAdminError(err.message || 'Ошибка сети');
                      } finally {
                        setAdminLoading(false);
                      }
                    }}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded transition cursor-pointer disabled:opacity-40 font-bold"
                  >
                    {adminLoading ? t('Проверка...', 'Verifying...') : t('Войти', 'Verify & Login')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
