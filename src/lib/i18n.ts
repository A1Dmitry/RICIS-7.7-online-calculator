import { useState, useEffect, createContext, useContext } from 'react';

export type Language = 'ru' | 'en';

// Dictionary of common terms for automatic translations when only RU string is passed,
// and as a fallback database.
export const dictionary: Record<string, Record<Language, string>> = {
  'Гравитационные сингулярности': {
    ru: 'Гравитационные сингулярности',
    en: 'Gravitational Singularities'
  },
  'Комплексный анализ (Полюса)': {
    ru: 'Комплексный анализ (Полюса)',
    en: 'Complex Analysis (Poles)'
  },
  'Кинематика манипуляторов': {
    ru: 'Кинематика манипуляторов',
    en: 'Kinematics of Manipulators'
  },
  'Уравнения Навье-Стокса': {
    ru: 'Уравнения Навье-Стокса',
    en: 'Navier-Stokes Equations'
  },
  'Дзета Римана (Полюс s=1)': {
    ru: 'Дзета Римана (Полюс s=1)',
    en: 'Riemann Zeta (Pole s=1)'
  },
  'Существование Янга-Миллса': {
    ru: 'Существование Янга-Миллса',
    en: 'Yang-Mills Existence'
  },
  'P vs NP (Сложность)': {
    ru: 'P vs NP (Сложность)',
    en: 'P vs NP (Complexity)'
  },
  'Гипотеза Ходжа': {
    ru: 'Гипотеза Ходжа',
    en: 'Hodge Conjecture'
  },
  'Гипотеза BSD': {
    ru: 'Гипотеза BSD',
    en: 'BSD Conjecture'
  },
  'Сфера Пуанкаре': {
    ru: 'Сфера Пуанкаре',
    en: 'Poincaré Sphere'
  },
  'Математическое обоснование': {
    ru: 'Математическое обоснование',
    en: 'Mathematical Rationale'
  },
  'Решенные проблемы (RICIS)': {
    ru: 'Решенные проблемы (RICIS)',
    en: 'Solved Problems (RICIS)'
  },
  'Фигуры Хладни': {
    ru: 'Фигуры Хладни',
    en: 'Chladni Figures'
  },
  'ИИ Ассистент RICIS': {
    ru: 'ИИ Ассистент RICIS',
    en: 'RICIS AI Assistant'
  },
  'SYSTEM STATUS': {
    ru: 'SYSTEM STATUS',
    en: 'SYSTEM STATUS'
  },
  'STABLE / CORE OK': {
    ru: 'STABLE / CORE OK',
    en: 'STABLE / CORE OK'
  },
  'ENTROPY BIAS': {
    ru: 'ENTROPY BIAS',
    en: 'ENTROPY BIAS'
  },
  'UPTIME HOURS': {
    ru: 'UPTIME HOURS',
    en: 'UPTIME HOURS'
  },
  'Интерактивный вычислительный комплекс для решения и регуляризации гравитационных, комплексных и кинематических сингулярностей.': {
    ru: 'Интерактивный вычислительный комплекс для решения и регуляризации гравитационных, комплексных и кинематических сингулярностей.',
    en: 'Interactive computing suite for solving and regularizing gravitational, complex, and kinematic singularities.'
  },
  'Еще': {
    ru: 'Еще',
    en: 'More'
  },
  'Показать скрытые разделы': {
    ru: 'Показать скрытые разделы',
    en: 'Show hidden sections'
  },
  'Раздел': {
    ru: 'Раздел',
    en: 'Section'
  },
  'Вес': {
    ru: 'Вес',
    en: 'Weight'
  },
  'NODES ACTIVE': {
    ru: 'NODES ACTIVE',
    en: 'NODES ACTIVE'
  },
  'CLUSTER': {
    ru: 'CLUSTER',
    en: 'CLUSTER'
  },
  'SECURE ENCLAVE ACTIVE': {
    ru: 'SECURE ENCLAVE ACTIVE',
    en: 'SECURE ENCLAVE ACTIVE'
  },
  'ENCRYPTION': {
    ru: 'ENCRYPTION',
    en: 'ENCRYPTION'
  },
  '2026 г.': {
    ru: '2026 г.',
    en: '2026'
  },
  'Решенные проблемы и сценарии регуляризации': {
    ru: 'Решенные проблемы и сценарии регуляризации',
    en: 'Solved Problems & Regularization Scenarios'
  },
  'В рамках парадигмы RICIS III координатные и физические сингулярности устраняются за счет введения калибровочного регуляризатора θ. Выберите сценарий для запуска симуляции в соответствующем модуле.': {
    ru: 'В рамках парадигмы RICIS III координатные и физические сингулярности устраняются за счет введения калибровочного регуляризатора θ. Выберите сценарий для запуска симуляции в соответствующем модуле.',
    en: 'Within the RICIS III paradigm, coordinate and physical singularities are resolved by introducing the gauge regularizer θ. Select a scenario to launch the simulation in the corresponding module.'
  },
  'Теория относительности и Чёрные дыры': {
    ru: 'Теория относительности и Чёрные дыры',
    en: 'Relativity & Black Holes'
  },
  'Координатная сингулярность Шварцшильда': {
    ru: 'Координатная сингулярность Шварцшильда',
    en: 'Schwarzschild Coordinate Singularity'
  },
  'Гравитационный коллапс и горизонт событий. Полюс в метрике устраняется абсолютно непрерывно.': {
    ru: 'Гравитационный коллапс и горизонт событий. Полюс в метрике устраняется абсолютно непрерывно.',
    en: 'Gravitational collapse and event horizon. The metric pole is eliminated absolutely continuously.'
  },
  'Быстрое вращение и Kerr-Newman': {
    ru: 'Быстрое вращение и Kerr-Newman',
    en: 'Fast Rotation & Kerr-Newman'
  },
  'Кольцевая сингулярность и эргосфера. Регуляризация предотвращает бесконечную кривизну.': {
    ru: 'Кольцевая сингулярность и эргосфера. Регуляризация предотвращает бесконечную кривизну.',
    en: 'Ring singularity and ergosphere. Regularization prevents infinite curvature.'
  },
  'Комплексный анализ и Полюса': {
    ru: 'Комплексный анализ и Полюса',
    en: 'Complex Analysis & Poles'
  },
  'Простой полюс первого порядка': {
    ru: 'Простой полюс первого порядка',
    en: 'Simple First-Order Pole'
  },
  'Функция 1/(z-z₀). Регуляризатор сглаживает сингулярность до конечной гладкой формы.': {
    ru: 'Функция 1/(z-z₀). Регуляризатор сглаживает сингулярность до конечной гладкой формы.',
    en: 'Function 1/(z-z₀). The regularizer smooths the singularity to a finite smooth shape.'
  },
  'Существенная сингулярность': {
    ru: 'Существенная сингулярность',
    en: 'Essential Singularity'
  },
  'Функция exp(1/z) с бесконечными осцилляциями. Регуляризация стабилизирует хаос.': {
    ru: 'Функция exp(1/z) с бесконечными осцилляциями. Регуляризация стабилизирует хаос.',
    en: 'Function exp(1/z) with infinite oscillations. Regularization stabilizes chaos.'
  },
  'Робототехника и Кинематика': {
    ru: 'Робототехника и Кинематика',
    en: 'Robotics & Kinematics'
  },
  'Сингулярность выравнивания звеньев': {
    ru: 'Сингулярность выравнивания звеньев',
    en: 'Link Alignment Singularity'
  },
  'Потеря степени свободы манипулятора. Регуляризация RICIS сохраняет управляемость.': {
    ru: 'Потеря степени свободы манипулятора. Регуляризация RICIS сохраняет управляемость.',
    en: 'Loss of manipulator degree of freedom. RICIS regularization preserves controllability.'
  },
  'Сверхвысокие скорости': {
    ru: 'Сверхвысокие скорости',
    en: 'Ultra-High Velocities'
  },
  'Неограниченное ускорение в окрестности сингулярности. Плавное демпфирование скоростей.': {
    ru: 'Неограниченное ускорение в окрестности сингулярности. Плавное демпфирование скоростей.',
    en: 'Unbounded acceleration near singularity. Smooth velocity damping.'
  },
  'Гидродинамика и Вихри': {
    ru: 'Гидродинамика и Вихри',
    en: 'Hydrodynamics & Vortices'
  },
  'Сингулярность затухания Навье-Стокса': {
    ru: 'Сингулярность затухания Навье-Стокса',
    en: 'Navier-Stokes Damping Singularity'
  },
  'Разрыв решений при критических числах Рейнольдса. Стабилизация вихревых ядер.': {
    ru: 'Разрыв решений при критических числах Рейнольдса. Стабилизация вихревых ядер.',
    en: 'Blow-up of solutions at critical Reynolds numbers. Vortex core stabilization.'
  },
  'Теория чисел и Дзета Римана': {
    ru: 'Теория чисел и Дзета Римана',
    en: 'Number Theory & Riemann Zeta'
  },
  'Полюс s = 1 дзета-функции': {
    ru: 'Полюс s = 1 дзета-функции',
    en: 'Pole s = 1 of Riemann Zeta Function'
  },
  'Сглаживание бесконечной гармонической суммы с сохранением аналитического продолжения.': {
    ru: 'Сглаживание бесконечной гармонической суммы с сохранением аналитического продолжения.',
    en: 'Smoothing of the infinite harmonic sum while preserving the analytic continuation.'
  },
  'Квантовая калибровочная теория': {
    ru: 'Квантовая калибровочная теория',
    en: 'Quantum Gauge Theory'
  },
  'Сингулярность Янга-Миллса': {
    ru: 'Сингулярность Янга-Миллса',
    en: 'Yang-Mills Singularity'
  },
  'Инфракрасный предел и удержание цвета. Регуляризация устраняет расходимость потенциала.': {
    ru: 'Инфракрасный предел и удержание цвета. Регуляризация устраняет расходимость потенциала.',
    en: 'Infrared limit and color confinement. Regularization resolves potential divergence.'
  },
  'Теория сложности алгоритмов': {
    ru: 'Теория сложности алгоритмов',
    en: 'Algorithm Complexity Theory'
  },
  'Ландшафт сложности P vs NP': {
    ru: 'Ландшафт сложности P vs NP',
    en: 'P vs NP Complexity Landscape'
  },
  'Регуляризация барьеров неэкспоненциальной сложности для нахождения субоптимальных решений.': {
    ru: 'Регуляризация барьеров неэкспоненциальной сложности для нахождения субоптимальных решений.',
    en: 'Regularization of non-exponential complexity barriers to find sub-optimal solutions.'
  },
  'Топология и Алгебраическая геометрия': {
    ru: 'Топология и Алгебраическая геометрия',
    en: 'Topology & Algebraic Geometry'
  },
  'Алгебраические циклы Ходжа': {
    ru: 'Алгебраические циклы Ходжа',
    en: 'Hodge Algebraic Cycles'
  },
  'Разрешение особенностей многообразий с использованием когомологических регуляризаторов.': {
    ru: 'Разрешение особенностей многообразий с использованием когомологических регуляризаторов.',
    en: 'Resolution of manifold singularities using cohomological regularizers.'
  },
  'Эллиптические кривые и BSD': {
    ru: 'Эллиптические кривые и BSD',
    en: 'Elliptic Curves & BSD'
  },
  'Сингулярность L-функции BSD': {
    ru: 'Сингулярность L-функции BSD',
    en: 'BSD L-function Singularity'
  },
  'Регуляризация полюсов L-ряда для точного вычисления ранга эллиптической кривой.': {
    ru: 'Регуляризация полюсов L-ряда для точного вычисления ранга эллиптической кривой.',
    en: 'Regularization of L-series poles for precise elliptic curve rank calculation.'
  },
  'Трехмерная топология': {
    ru: 'Трехмерная топология',
    en: 'Three-Dimensional Topology'
  },
  'Перешеек Пуанкаре (Ricci Flow)': {
    ru: 'Перешеек Пуанкаре (Ricci Flow)',
    en: 'Poincaré Neckpinch (Ricci Flow)'
  },
  'Регуляризация сингулярностей типа "neckpinch" в потоках Риччи без топологической перестройки.': {
    ru: 'Регуляризация сингулярностей типа "neckpinch" в потоках Риччи без топологической перестройки.',
    en: 'Regularization of "neckpinch" singularities in Ricci flows without topological surgery.'
  },
  'Колебания и Фигуры Хладни': {
    ru: 'Колебания и Фигуры Хладни',
    en: 'Vibrations & Chladni Figures'
  },
  'Интерференция и Резонанс Хладни': {
    ru: 'Интерференция и Резонанс Хладни',
    en: 'Chladni Resonance & Interference'
  },
  'Суперпозиция волновых мод. Регуляризатор RICIS предотвращает разрывы фазовых скоростей.': {
    ru: 'Суперпозиция волновых мод. Регуляризатор RICIS предотвращает разрывы фазовых скоростей.',
    en: 'Superposition of wave modes. RICIS regularizer prevents phase velocity discontinuities.'
  },
  'Запустить симуляцию': {
    ru: 'Запустить симуляцию',
    en: 'Launch Simulation'
  },
  'Активный сценарий': {
    ru: 'Активный сценарий',
    en: 'Active Scenario'
  },
  'Интеллектуальный ассистент RICIS III': {
    ru: 'Интеллектуальный ассистент RICIS III',
    en: 'RICIS III Intelligent Assistant'
  },
  'Интегрированный агент поддержки принятия решений на базе унифицированного документа согласованности RICIS.': {
    ru: 'Интегрированный агент поддержки принятия решений на базе унифицированного документа согласованности RICIS.',
    en: 'Integrated decision support agent based on the Unified RICIS Consistency Document.'
  },
  'База знаний RICIS': {
    ru: 'База знаний RICIS',
    en: 'RICIS Knowledge Base'
  },
  'Отзывы и Пожелания': {
    ru: 'Отзывы и Пожелания',
    en: 'Reviews & Wishes'
  },
  'Об авторе и контакты': {
    ru: 'Об авторе и контакты',
    en: 'About Author & Contacts'
  },
  'Оставить отзыв или пожелание': {
    ru: 'Оставить отзыв или пожелание',
    en: 'Leave a Review or Wish'
  },
  'Ваш отзыв отправляется напрямую в единый реестр обратной связи. Ваши пожелания будут учтены в будущих версиях.': {
    ru: 'Ваш отзыв отправляется напрямую в единый реестр обратной связи. Ваши пожелания будут учтены в будущих версиях.',
    en: 'Your feedback goes directly to the unified feedback registry. Your wishes will be considered in future releases.'
  },
  'Ваше имя или организация:': {
    ru: 'Ваше имя или организация:',
    en: 'Your name or organization:'
  },
  'Текст отзыва / пожелания:': {
    ru: 'Текст отзыва / пожелания:',
    en: 'Review / wish text:'
  },
  'Отправить отзыв': {
    ru: 'Отправить отзыв',
    en: 'Submit Review'
  },
  'Введите текст вашего обращения...': {
    ru: 'Введите текст вашего обращения...',
    en: 'Type your message here...'
  },
  'Список отзывов и пожеланий': {
    ru: 'Список отзывов и пожеланий',
    en: 'List of reviews and wishes'
  },
  'Имя / Организация': {
    ru: 'Имя / Организация',
    en: 'Name / Organization'
  },
  'Пожелание / Отзыв': {
    ru: 'Пожелание / Отзыв',
    en: 'Wish / Review'
  },
  'Дата': {
    ru: 'Дата',
    en: 'Date'
  },
  'Действие': {
    ru: 'Действие',
    en: 'Action'
  },
  'Удалить': {
    ru: 'Удалить',
    en: 'Delete'
  },
  'Очистить все': {
    ru: 'Очистить все',
    en: 'Clear All'
  },
  'Отзывов пока нет. Будьте первым!': {
    ru: 'Отзывов пока нет. Будьте первым!',
    en: 'No reviews yet. Be the first!'
  },
  'Секретная фраза': {
    ru: 'Секретная фраза',
    en: 'Secret Phrase'
  },
  'Вы можете оставить отзыв напрямую': {
    ru: 'Вы можете оставить отзыв напрямую',
    en: 'You can leave a review directly'
  },
  'Скрыть форму отзыва': {
    ru: 'Скрыть форму отзыва',
    en: 'Hide review form'
  },
  'Показать форму отзыва': {
    ru: 'Показать форму отзыва',
    en: 'Show review form'
  }
};

// Global language state
let currentLanguage: Language = 'en';

// Detect browser default language on module load
try {
  const browserLang = navigator.language || '';
  const stored = localStorage.getItem('ricis_lang');
  if (stored === 'ru' || stored === 'en') {
    currentLanguage = stored;
  } else if (browserLang.toLowerCase().startsWith('ru')) {
    currentLanguage = 'ru';
  } else {
    currentLanguage = 'en';
  }
} catch (e) {
  // SSR or iframe boundary
}

// Custom listeners for reactive updates
const listeners = new Set<() => void>();

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language) {
  if (lang !== currentLanguage) {
    currentLanguage = lang;
    try {
      localStorage.setItem('ricis_lang', lang);
    } catch (e) {}
    listeners.forEach(listener => listener());
  }
}

// React context for language
interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (ru: string, en?: string) => string;
}

export const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Hook to subscribe to language changes reactive in React
export function useLanguage() {
  const [lang, setLang] = useState<Language>(getLanguage());

  useEffect(() => {
    const handleUpdate = () => {
      setLang(getLanguage());
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const translate = (ru: string, en?: string): string => {
    if (lang === 'ru') return ru;
    if (en !== undefined) return en;
    // Look up in dictionary
    if (dictionary[ru]) {
      return dictionary[ru].en;
    }
    // Simple direct rules / fallback
    return ru;
  };

  return {
    language: lang,
    setLanguage,
    t: translate
  };
}

// Standalone global translation helper
export function t(ru: string, en?: string): string {
  const lang = getLanguage();
  if (lang === 'ru') return ru;
  if (en !== undefined) return en;
  if (dictionary[ru]) {
    return dictionary[ru].en;
  }
  return ru;
}
