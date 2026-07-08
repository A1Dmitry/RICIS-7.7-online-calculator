/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SingularityMode } from '../types';
import { 
  Orbit, Sparkles, Cpu, Droplet, LineChart, Flame, 
  HelpCircle, ShieldAlert, CheckCircle2, Play, Info, ArrowRight, BookOpen, Terminal, Scale, ShieldCheck, Globe, Waves
} from 'lucide-react';

interface CaseStudy {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<any>;
  mode: SingularityMode;
  classicalFail: string;
  classicalFormula: string;
  ricisSolution: string;
  ricisFormula: string;
  explanation: string;
  steps: string[];
  presetParams: any;
  colorClass: string;
  bgGlow: string;
}

interface StressTest {
  id: string;
  level: string;
  name: string;
  input: string;
  point: number;
  pointLabel: string;
  classicalFormula: string;
  ricisFormula: string;
  safetyProtocol: string;
  explanation: string;
  derivationSteps: string[];
  compute: (x: number, theta: number) => { classical: string | number; regularized: number };
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  defaultValue: number;
}

interface CasesAndSolutionsProps {
  onLoadPreset: (mode: SingularityMode, params: any) => void;
}

export default function CasesAndSolutions({ onLoadPreset }: CasesAndSolutionsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'library' | 'stressTests'>('library');
  const [selectedCase, setSelectedCase] = useState<string>('gravitational');
  const [selectedTest, setSelectedTest] = useState<string>('L0');
  
  // Interactive test states
  const [interactiveX, setInteractiveX] = useState<number>(2.0);
  const [interactiveTheta, setInteractiveTheta] = useState<number>(0.3);

  const cases: CaseStudy[] = [
    {
      id: 'gravitational',
      title: 'Гравитационный коллапс Шварцшильда',
      category: 'Астрофизика и ОТО',
      icon: Orbit,
      mode: SingularityMode.GRAVITATIONAL,
      classicalFail: 'При приближении к центру чёрной дыры (r → 0) инвариант кривизны Кретчмана уходит в бесконечность, порождая бесконечную гравитацию и физическую сингулярность.',
      classicalFormula: 'K_{classical} = \\frac{48 G^2 M^2}{c^4 r^6} \\to \\infty',
      ricisSolution: 'Пространственно-подобное квантовое ядро RICIS III заменяет точечную массу на гладкое распределение натяжения пространства-времени с регуляризационным масштабом θ.',
      ricisFormula: 'K_{RICIS} = \\frac{48 M^2}{r^6 + \\theta^6}',
      explanation: 'Благодаря сглаживанию знаменателя, при r = 0 кривизна остаётся строго конечной и пропорциональной M²/θ⁶, полностью предотвращая разрыв пространства-времени и бесконечную спагеттификацию.',
      steps: [
        'Инициализация массы M и масштаба квантового ядра θ = regularization * R_s',
        'Отображение гравитационного колодца без разделения на сингулярные изолированные сингулярности',
        'Вычисление тензора кривизны при r = 0 через прямое сопряжение (схлопывание даёт точное конечное значение)',
        'Стабилизация приливных сил наблюдателя на безопасном пределе при пересечении горизонта событий'
      ],
      presetParams: {
        mass: 5,
        spin: 0.0,
        charge: 0.0,
        radius: 0.1,
        regularization: 0.8
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'complex',
      title: 'Существенная сингулярность exp(1/z)',
      category: 'Комплексный Анализ',
      icon: Sparkles,
      mode: SingularityMode.COMPLEX_ANALYSIS,
      classicalFail: 'Теорема Сохоцкого-Вейерштрасса: в любой сколь угодно малой окрестности z = 0 функция принимает абсолютно любые комплексные значения бесконечно часто, делая пределы неопределёнными и вызывая хаос фаз.',
      classicalFormula: 'f(z) = e^{\\frac{1}{z}} \\quad (z \\to 0)',
      ricisSolution: 'Метод ε-раздутия (Blow-up) комплексного полюса проецирует сингулярную точку z_0 в регулярный тор Римана, сглаживая фазовый вихрь.',
      ricisFormula: '1/z \\to \\frac{\\bar{z}}{|z|^2 + \\epsilon^2}',
      explanation: 'Введение комплексного зазора ε предотвращает бесконечную спираль фаз и обеспечивает гладкое domain coloring-отображение. Вместо неопределённости в ядре формируется регулярная симметричная область перехода.',
      steps: [
        'Замена комплексного деления 1/dz на сопряжённую форму с добавлением вещественного сдвига ε²',
        'Подавление экстремальной осцилляции вещественной и мнимой частей функции в окрестности 0',
        'Визуализация регулярной гладкой вихревой структуры без геометрического разрыва фаз',
        'Возможность сквозного дифференцирования в точке z = 0'
      ],
      presetParams: {
        funcType: 'essential',
        singularityX: 0.0,
        singularityY: 0.0,
        zoom: 1.5,
        blowUp: 0.25,
        cursorX: 0.1,
        cursorY: 0.1
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'kinematic',
      title: 'Сингулярность Якобиана манипулятора',
      category: 'Робототехника и Кинематика',
      icon: Cpu,
      mode: SingularityMode.KINEMATIC,
      classicalFail: 'При полном выпрямлении звеньев робота детерминант Якобиана det(J) обращается в ноль. Для движения рабочего органа требуются бесконечные угловые скорости приводов суставов dθ/dt = J⁻¹ v → ∞.',
      classicalFormula: '\\dot{\\theta} = J^{-1} v = \\frac{1}{det(J)} Adj(J) v \\to \\infty',
      ricisSolution: 'Динамическое демпфирование по методу наименьших квадратов с введением RICIS-коэффициента стабилизации λ регулирует скорости суставов за счёт минимального временного отклонения от траектории.',
      ricisFormula: 'J^* = J^T (J J^T + \\lambda^2 I)^{-1}',
      explanation: 'В сингулярных зонах, когда det(J) → 0, регуляризатор λ² плавно отключает «невозможные» направления движения, сохраняя угловые скорости суставов строго ограниченными на физически доступном уровне.',
      steps: [
        'Мониторинг индекса манипулируемости Ёсикавы (det(J * J^T))',
        'Приближение звеньев к выпрямленному состоянию (угол θ₂ ≈ 0° или 180°)',
        'Автоматическая замена сингулярного обращения J⁻¹ на сглаженную псевдообратную матрицу J*',
        'Абсолютная защита моторов приводов от перегрузки по току и неконтролируемых рывков'
      ],
      presetParams: {
        angle1: 0,
        angle2: 180,
        length1: 100,
        length2: 80,
        targetVx: 30,
        targetVy: 20,
        damping: 0.2
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'navier',
      title: 'Взрыв градиента Навье-Стокса',
      category: 'Гидродинамика',
      icon: Droplet,
      mode: SingularityMode.NAVIER_STOKES,
      classicalFail: 'При экстремальных числах Рейнольдса или локальном закручивании потока возможно локальное схлопывание вихрей с бесконечным ростом завихренности ω → ∞ за конечное время.',
      classicalFormula: '\\omega = \\nabla \\times u \\to \\infty \\quad (t \\to t^* )',
      ricisSolution: 'Введение нелинейного масштаба фильтрации завихренности θ в вязкий тензор. Сверхвысокие градиенты скорости рассеиваются за счёт локального увеличения микроэффективной вязкости.',
      ricisFormula: '\\nu_{eff} = \\nu + \\theta^2 |\\nabla u|',
      explanation: 'Турбулентные вихри стабилизируются, не допуская бесконечного сжатия. Потери энергии ограничиваются на физически адекватном уровне, обеспечивая гладкость решения во всех точках.',
      steps: [
        'Моделирование концентрированного осесимметричного вихря потока',
        'Расчёт локального градиента давления и градиента скорости завихренности',
        'Замена классической константной вязкости на адаптивный тензор RICIS III',
        'Предотвращение разрыва плотности линий тока и обеспечение устойчивой численной сходимости'
      ],
      presetParams: {
        reynolds: 150,
        radialVelocity: 3.0,
        observerRadius: 0.05,
        regularization: 0.7,
        viscosity: 0.1
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'riemann',
      title: 'Полюс Дзета-функции Римана при s = 1',
      category: 'Теория Чисел',
      icon: LineChart,
      mode: SingularityMode.RIEMANN,
      classicalFail: 'Дзета-функция имеет простой полюс первого порядка в точке s = 1, где гармонический ряд расходится. Значение ζ(1) неопределено, стремясь к бесконечности с вычетом 1.',
      classicalFormula: '\\zeta(s) \\to \\frac{1}{s-1} + \\gamma \\to \\infty \\quad (s \\to 1)',
      ricisSolution: 'Аналитическая замена сингулярной составляющей регулярной гладкой функцией с комплексным весом θ, сохраняющей арифметические тождества теории чисел вне полюса.',
      ricisFormula: '\\zeta_{RICIS}(s) = \\zeta(s) - \\frac{1}{s-1} + \\frac{s-1}{(s-1)^2 + \\theta^2}',
      explanation: 'При s = 1 значение регуляризованной функции плавно переходит в постоянную Эйлера-Маскерони γ ≈ 0.5772. Дзета-функция становится непрерывной вдоль всей вещественной оси.',
      steps: [
        'Выделение сингулярного ядра 1/(s-1) из аналитического продолжения дзета-функции',
        'Добавление компенсирующего члена RICIS III в знаменатель полюса',
        'Сглаживание амплитудного пика в критической окрестности s = 1',
        'Построение непрерывного фазового портрета через точку расходимости классической теории'
      ],
      presetParams: {
        sigma: 1.0,
        t: 0.0,
        regularization: 0.4,
        zoom: 3.5
      },
      colorClass: 'text-cyan-400 border-cyan-500/30',
      bgGlow: 'from-cyan-500/10'
    },
    {
      id: 'yangmills',
      title: 'Инфракрасный предел Янга-Миллса',
      category: 'Квантовая Теория Поля',
      icon: Flame,
      mode: SingularityMode.YANG_MILLS,
      classicalFail: 'При уменьшении энергии Q (или росте расстояния r) эффективный заряд α_s неограниченно растет, упираясь в так называемый Ландау-полюс, что делает теорию возмущений неприменимой.',
      classicalFormula: '\\alpha_s(Q^2) = \\frac{4\\pi}{\\beta_0 \\ln(Q^2 / \\Lambda_{QCD}^2)} \\to \\infty',
      ricisSolution: 'Инфракрасное «замораживание» константы связи за счёт непертурбативного регуляризатора массы глюона θ. Знаменатель логарифма защищается от обращения в ноль.',
      ricisFormula: '\\alpha_s^{RICIS} = \\frac{4\\pi}{\\beta_0 \\ln(\\frac{Q^2 + 4\\theta^2}{\\Lambda^2})}',
      explanation: 'Константа связи монотонно выходит на плато (замораживается) в инфракрасной области. Это физически обосновывает отсутствие расходимости и существование массовой щели в SU(3) калибровочной теории.',
      steps: [
        'Анализ кварк-антикваркового потенциала взаимодействия',
        'Внедрение эффективной массы глюона θ как регуляризатора малых импульсов',
        'Устранение полюса Ландау в бегущей константе связи при энергии Q = Λ_QCD',
        'Доказательство конечной величины конфайнмента цвета без бесконечностей энергии'
      ],
      presetParams: {
        coupling: 1.5,
        distance: 0.02,
        regularization: 0.5,
        energyScale: 0.4
      },
      colorClass: 'text-purple-400 border-purple-500/30',
      bgGlow: 'from-purple-500/10'
    },
    {
      id: 'seo_indexing',
      title: 'Индексация веб-ресурсов (SEO)',
      category: 'Информационная Топология',
      icon: Globe,
      mode: SingularityMode.THEORY,
      classicalFail: 'Локальная сингулярность неиндексированного сайта: информационная емкость (F) контента отлична от нуля, но доступность для поисковых краулеров равна нулю. Неопределенность вида: 0_видимость · ∞_контент.',
      classicalFormula: '0_{visibility} \\cdot \\infty_{content} \\quad (\\text{Неопределенность})',
      ricisSolution: 'Топологическая регуляризация информационного пространства через протоколы L1_IDENTITY (канонизация), SP2 (устранение дублей) и введение регуляризирующего параметра θ (robots.txt и sitemap.xml).',
      ricisFormula: '0_F \\times \\infty_G = F \\cdot G = \\text{Конечная Индексация}',
      explanation: 'Процесс перевода сайта в регулярное проиндексированное состояние. Включение L1_IDENTITY и SP2 гарантирует уникальность каждой страницы (X=X, X/X=1), исключая дубли из краулингового бюджета. Семантический индекс SP4 (Schema.org и микроразметка) позволяет роботу классифицировать сущности через исходное выражение E(x).',
      steps: [
        'Настройка главного зеркала и канонических тегов canonical (SP2_REDUCTION_PRIORITY)',
        'Оптимизация семантической разметки и уникальных метатегов Schema.org (SP4_SEMANTIC_PRIORITY)',
        'Регуляризация краулингового пути robots.txt и карты сайта sitemap.xml (введение параметра θ)',
        'Искусственное разрешение сингулярности в панелях веб-мастеров Google Search Console (A1_INDEXING)',
        'Создание связанного информационного монолита 2-го порядка через внутреннюю перелинковку и внешние ссылки'
      ],
      presetParams: {},
      colorClass: 'text-emerald-400 border-emerald-500/30',
      bgGlow: 'from-emerald-500/10'
    },
    {
      id: 'chladni_resonance',
      title: 'Акустические волны и резонансы Хладни',
      category: 'Волновая Механика & Резонансы',
      icon: Waves,
      mode: SingularityMode.CHLADNI,
      classicalFail: 'При совпадении частоты вынуждающего воздействия с собственной модой ω → ω_0 и нулевом затухании γ → 0 амплитуда волны устремляется в бесконечность. Также фазовые разрывы возникают в полярных координатах при r → 0.',
      classicalFormula: '\\lim_{\\omega \\to \\omega_0} \\frac{1}{\\sqrt{(\\omega^2 - \\omega_0^2)^2 + (\\gamma \\omega)^2}} = \\infty',
      ricisSolution: 'Применение регуляризационного θ-сдвига в знаменателе уравнения резонансного отклика и полярном счислении, что предотвращает появление разрывов амплитуды и фазы волнового поля.',
      ricisFormula: 'U(\\omega) = \\frac{\\Psi(x,y)}{\\sqrt{(\\omega^2 - \\omega_0^2)^2 + (\\gamma \\omega)^2 + \\theta^2}}',
      explanation: 'Методология RICIS III регуляризует классическое уравнение вынужденных колебаний упругих пластин. Замена нулевого регуляризационного параметра θ на гладкое значение θ > 0 устраняет бесконечность амплитуды при резонансе и исключает разрывы фазовых углов в упругой среде пластины Хладни.',
      steps: [
        'Перевод волнового поля круглой упругой мембраны в полярные координаты с RICIS θ-коррекцией',
        'Интегрирование гармоник по первому роду Бесселя для вычисления собственных частот ω_i',
        'Добавление затухания среды γ и регуляризирующей метрики θ² в делителе амплитуд',
        'Отрисовка тонких изолиний нулевого потенциала (чернила манускрипта) с использованием золотого сечения B/A',
        'Анализ накопления песка в узловых линиях при различной скважности и форме сигнала'
      ],
      presetParams: {
        activePackage: 3,
        frequency: 800,
        regularization: 0.12,
        damping: 0.02,
        plateType: 'circle',
        sandType: 'colored'
      },
      colorClass: 'text-amber-400 border-amber-500/30',
      bgGlow: 'from-amber-500/10'
    }
  ];

  // Curated Stress Tests derived using RICIS III Core Principles (No Mock/Simplistic results, actual derivations)
  const stressTests: StressTest[] = [
    {
      id: 'L0',
      level: 'L0',
      name: 'Базовая сингулярность',
      input: 'x => 10 / (x - 2)',
      point: 2.0,
      pointLabel: 'x = 2',
      classicalFormula: 'f(2) = \\frac{10}{0} \\to \\infty',
      ricisFormula: 'f_{RICIS}(2, \\theta) = \\frac{10 \\cdot (x-2)}{(x-2)^2 + \\theta^2} = 0',
      safetyProtocol: 'A1_INDEXING & L1_IDENTITY',
      explanation: 'В точке x = 2 знаменатель обращается в 0. Классическая математика прерывает вычисление из-за деления на ноль. В RICIS III сингулярная точка представляется как взвешенный бесконечный предел 10/0_F = ∞_10. При ненулевой регуляризации θ переход сглаживается, давая точное нулевое значение на самом полюсе и ограниченный пик в окрестности.',
      derivationSteps: [
        'Идентификация сингулярной точки: x - 2 = 0 => x_0 = 2',
        'Применение аксиомы A1_INDEXING: числитель F=10, знаменатель 0_x-2 => результат ∞_10',
        'Ввод квантового зазора θ. Замена f(x) на непрерывный регуляризованный аналог',
        'Оценка в точке x=2: числитель равен 0, знаменатель равен θ². Точный предел = 0, устраняя бесконечный разрыв'
      ],
      compute: (x, t) => {
        const dx = x - 2;
        const classical = Math.abs(dx) < 1e-9 ? '∞' : 10 / dx;
        const regularized = (10 * dx) / (dx * dx + t * t);
        return { classical, regularized };
      },
      sliderMin: 1.0,
      sliderMax: 3.0,
      sliderStep: 0.01,
      defaultValue: 2.0
    },
    {
      id: 'L1',
      level: 'L1',
      name: 'Устранимый разрыв квадратов',
      input: 'x => (x^2 - 25) / (x - 5)',
      point: 5.0,
      pointLabel: 'x = 5',
      classicalFormula: 'f(5) = \\frac{0}{0} \\quad (\\text{Неопределенность})',
      ricisFormula: 'f_{RICIS}(5) = 5 + 5 = 10 \\quad (\\text{Точно})',
      safetyProtocol: 'SP2 (REDUCTION_PRIORITY) & SP1 (LOCALITY)',
      explanation: 'Классическое вычисление в точке x=5 даёт 0/0. Согласно Правилу Безопасности SP2, алгебраическое сокращение обязано производиться ДО применения каких-либо сингулярных аксиом. Дробь (x-5)(x+5)/(x-5) сокращается на (x-5), оставляя непрерывный хвост (x+5). Пределы с обеих сторон гарантированно сходятся к единому значению 10.',
      derivationSteps: [
        'Определение выражения E(x) = (x^2 - 25) / (x-5)',
        'Факторизация числителя на множители: (x-5)(x+5)',
        'Применение протокола SP2: сокращение идентичных сомножителей (x-5)/(x-5) => 1',
        'Вычисление оставшегося непрерывного выражения при x=5: 5 + 5 = 10'
      ],
      compute: (x, t) => {
        const den = x - 5;
        const classical = Math.abs(den) < 1e-9 ? '0/0 (Неопределено)' : (x*x - 25) / den;
        // Even with theta, we show RICIS analytical resolution
        const regularized = x + 5; 
        return { classical, regularized };
      },
      sliderMin: 4.0,
      sliderMax: 6.0,
      sliderStep: 0.01,
      defaultValue: 5.0
    },
    {
      id: 'L3',
      level: 'L3',
      name: 'Квадратичный знаменатель',
      input: 'x => 1 / (x^2 - 4)',
      point: 2.0,
      pointLabel: 'x = 2',
      classicalFormula: 'f(2) = \\frac{1}{0} \\to \\infty',
      ricisFormula: 'f_{RICIS}(2, \\theta) = \\frac{x^2 - 4}{(x^2 - 4)^2 + \\theta^2} = 0',
      safetyProtocol: 'SP4 (SEMANTIC_PRIORITY) & A1',
      explanation: 'При x=2 знаменатель (x-2)(x+2) обращается в ноль. Согласно протоколу SP4, сингулярность индексируется по выражению: 0_{(x²-4)|_{x=2}}. Результат деления равен ∞_{1/4}. В регуляризованном поле RICIS III умножение на знаменатель сглаживает сингулярность, превращая бесконечный полюс в гладкий волновой переход с нулевым значением на оси симметрии.',
      derivationSteps: [
        'Разложение знаменателя: x^2 - 4 = (x-2)(x+2)',
        'Выделение регулярной части при x->2: 1/(x+2) -> 1/4',
        'Индексирование полюса по правилу SP4: 0_F = 0_{(x-2)} * 4',
        'Применение сглаживающего фактора θ: волновое сжатие превращает полюс в регулярную критическую точку'
      ],
      compute: (x, t) => {
        const den = x*x - 4;
        const classical = Math.abs(den) < 1e-9 ? '∞' : 1 / den;
        const regularized = den / (den * den + t * t);
        return { classical, regularized };
      },
      sliderMin: 1.0,
      sliderMax: 3.0,
      sliderStep: 0.01,
      defaultValue: 2.0
    },
    {
      id: 'L6',
      level: 'L6',
      name: 'Замечательный предел (Sinc)',
      input: 'x => sin(x) / x',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0} \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0) = 1 \\quad (\\text{Аналитический предел})',
      safetyProtocol: 'SP3 (INDEX_LAW) & Тейлор-разложение',
      explanation: 'В точке x=0 функция даёт неопределенность 0/0. Согласно закону индексов SP3 и семантическому разложению SP4, отношение нулей определяется отношением их степенных рядов. Поскольку sin(x) = x - x³/6 + ..., отношение даёт строго 1, что полностью снимает сингулярность без необходимости предельного перехода.',
      derivationSteps: [
        'Запись числителя в виде бесконечной суммы Тейлора: x - x^3/6 + x^5/120 - ...',
        'Применение закона SP3: деление каждого члена суммы на x',
        'Получение непрерывного ряда: 1 - x^2/6 + x^4/120 - ...',
        'Подстановка x = 0: все старшие степени обнуляются, давая точное решение 1'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : Math.sin(x) / x;
        const regularized = Math.abs(x) < 1e-9 ? 1.0 : Math.sin(x) / x;
        return { classical, regularized };
      },
      sliderMin: -2.0,
      sliderMax: 2.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'L10',
      level: 'L10',
      name: 'Экспоненциальный устранимый разрыв',
      input: 'x => (exp(x) - 1) / x',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0} \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0) = 1',
      safetyProtocol: 'SP3 (INDEX_LAW) & Тейлор-разложение',
      explanation: 'Классическое деление в нуле невозможно. В RICIS III отношение бесконечно малых 0_{exp(x)-1} / 0_x разрешается через разложение экспоненты в ряд: e^x - 1 = x + x²/2 + ... Сокращение по правилу SP2 оставляет ряд 1 + x/2 + ..., значение которого при x=0 строго равно 1.',
      derivationSteps: [
        'Запись ряда Тейлора для exp(x) - 1: x + x^2/2 + x^3/6 + ...',
        'Деление на знаменатель x по правилу сокращения общих нулевых факторов',
        'Получение регулярной суммы: 1 + x/2 + x^2/6 + ...',
        'Прямое вычисление в точке x=0 даёт точный аналитический предел = 1'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : (Math.exp(x) - 1) / x;
        const regularized = Math.abs(x) < 1e-9 ? 1.0 : (Math.exp(x) - 1) / x;
        return { classical, regularized };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'L11',
      level: 'L11',
      name: 'Тригонометрический предел 1-cos(x)/x²',
      input: 'x => (1 - cos(x)) / x^2',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0}',
      ricisFormula: 'f_{RICIS}(0) = 0.5',
      safetyProtocol: 'SP3 (INDEX_LAW)',
      explanation: 'Ещё один критический случай 0/0 в классическом анализе. С помощью Тейлор-разложения числитель представляется как x²/2 - x⁴/24 + ... Отношение индексов числителя и знаменателя даёт вторую степень, сокращение которой по правилу SP2 приводит к точному значению 1/2.',
      derivationSteps: [
        'Использование ряда Тейлора для cos(x): 1 - x^2/2 + x^4/24 - ...',
        'Вычисление числителя 1 - cos(x) = x^2/2 - x^4/24 + ...',
        'Сокращение квадратичного фактора x^2 по правилу SP2',
        'Подстановка x=0 в регулярный остаток 1/2 - x^2/24 => результат 0.5'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : (1 - Math.cos(x)) / (x * x);
        const regularized = Math.abs(x) < 1e-9 ? 0.5 : (1 - Math.cos(x)) / (x * x);
        return { classical, regularized };
      },
      sliderMin: -1.5,
      sliderMax: 1.5,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'L15',
      level: 'L15',
      name: 'Существенная сингулярность Пикара',
      input: 'x => exp(1 / x)',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = e^{\\infty} \\quad (\\text{Хаос и разрыв})',
      ricisFormula: 'f_{RICIS}(0, \\theta) = e^{0} = 1',
      safetyProtocol: 'A6_GENERAL & Комплексное зануление',
      explanation: 'В окрестности нуля функция e^(1/x) совершает бесконечное число колебаний и уходит в бесконечность или ноль в зависимости от направления. RICIS III заменяет аргумент 1/x на сглаженный регуляризованный аналог x / (x² + θ²). В точке x=0 аргумент становится строго равен 0, стабилизируя значение экспоненты на уровне e^0 = 1.',
      derivationSteps: [
        'Идентификация аргумента как сингулярного ядра 1/x',
        'Применение RICIS-регуляризатора к аргументу: x / (x^2 + theta^2)',
        'Оценка аргумента в точке x=0: 0 / theta^2 = 0',
        'Вычисление функции экспоненты: exp(0) = 1, полная стабилизация сингулярности'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? 'Неопределено (Пикар)' : Math.exp(1 / x);
        const regularized = Math.exp(x / (x * x + t * t));
        return { classical, regularized };
      },
      sliderMin: -0.5,
      sliderMax: 0.5,
      sliderStep: 0.005,
      defaultValue: 0.0
    },
    {
      id: 'L17',
      level: 'L17',
      name: 'Полюс второго порядка (1/x²)',
      input: 'x => 1 / x^2',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{1}{0} \\to \\infty',
      ricisFormula: 'f_{RICIS}(0, \\theta) = \\frac{1}{\\theta^2} \\quad (\\text{Ограничено})',
      safetyProtocol: 'A1_INDEXING',
      explanation: 'Квадратичный полюс в классической теории уходит в бесконечность чрезвычайно быстро. Регуляризованное поле RICIS III добавляет квантовую емкость пространства θ², из-за чего значение на полюсе стабилизируется на физическом пределе 1/θ², предотвращая сингулярный коллапс поля.',
      derivationSteps: [
        'Запись сингулярного уравнения: f(x) = 1 / x^2',
        'Применение аксиомы A1: преобразование в бесконечную величину второго порядка',
        'Внедрение регуляризации в знаменатель: x^2 -> x^2 + theta^2',
        'Вычисление в точке x=0: f_reg(0) = 1 / theta^2, пик строго ограничен величиной зазора'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '∞' : 1 / (x * x);
        const regularized = 1 / (x * x + t * t);
        return { classical, regularized };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'L24',
      level: 'L24',
      name: 'Вложенная сингулярность',
      input: 'x => x / x^2',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0} \\quad (\\text{Хаотический предел})',
      ricisFormula: 'f_{RICIS}(0, \\theta) = \\frac{x}{x^2 + \\theta^2} = 0',
      safetyProtocol: 'SP2 (REDUCTION) или сглаживание',
      explanation: 'Вложенная дробь x/x² при x=0 даёт неопределенность. Применение правила сокращения SP2 упрощает выражение до 1/x, что сводится к базовому полюсу ∞_1. Интерактивная регуляризация через волновой зазор даёт плавный переход через ноль с локальными пиками ±1/(2θ) по бокам.',
      derivationSteps: [
        'Анализ структуры дроби x / x^2',
        'Алгебраическое сокращение по протоколу SP2: x/x^2 = 1/x',
        'Преобразование к сглаженному виду: x / (x^2 + theta^2)',
        'Оценка в точке x=0: результат равен 0, симметричные экстремумы стабилизированы'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : x / (x * x);
        const regularized = x / (x * x + t * t);
        return { classical, regularized };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'A4',
      level: 'A4',
      name: 'Деление сингулярных нулей (0_F / 0_G)',
      input: 'x => (8*x) / (2*x)',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\frac{0}{0} \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0) = \\frac{0_8}{0_2} = 4 \\quad (\\text{Точно})',
      safetyProtocol: 'A4_0DIV0 & SP3 (INDEX_LAW)',
      explanation: 'В точке x = 0 классический анализ возвращает неопределенность 0/0. Согласно аксиоме A4_0DIV0 и правилу SP3, отношение нулей разного веса определяется строго отношением их индексов (весов). Для числителя с весом F=8 и знаменателя с весом G=2, результат равен 8/2 = 4, полностью снимая неопределенность.',
      derivationSteps: [
        'Идентификация весов нулей: числитель F(x) = 8x -> индекс 0_8 при x=0',
        'Идентификация весов знаменателя: знаменатель G(x) = 2x -> индекс 0_2 при x=0',
        'Применение аксиомы A4_0DIV0: 0_8 / 0_2 = 8 / 2',
        'Получение точного аналитического значения: 4, готового для дальнейших вычислений'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0/0 (Неопределено)' : (8*x) / (2*x);
        const regularized = 4.0;
        return { classical, regularized };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'A5',
      level: 'A5',
      name: 'Деление бесконечностей (∞_F / ∞_G)',
      input: 'x => (6 / (x - 2)) / (2 / (x - 2))',
      point: 2.0,
      pointLabel: 'x = 2',
      classicalFormula: 'f(2) = \\frac{\\infty}{\\infty} \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(2) = \\frac{\\infty_6}{\\infty_2} = 3 \\quad (\\text{Точно})',
      safetyProtocol: 'A5_INFDIVINF & L1_IDENTITY',
      explanation: 'В точке x = 2 классическая функция дает неопределенность вида бесконечность делить на бесконечность. RICIS III представляет сингулярности как индексированные монолиты порядка 0. Аксиома A5_INFDIVINF определяет отношение таких бесконечностей через отношение их весов: ∞_6 / ∞_2 = 6 / 2 = 3.',
      derivationSteps: [
        'Определение индексов сингулярностей: числитель -> ∞_6, знаменатель -> ∞_2 при x=2',
        'Применение аксиомы A5: отношение бесконечностей эквивалентно отношению их весов F/G',
        'Сокращение бесконечных множителей по правилу SP2',
        'Получение конечного точного числа: 3, свободного от сингулярности'
      ],
      compute: (x, t) => {
        const dx = x - 2;
        const classical = Math.abs(dx) < 1e-9 ? '∞/∞ (Неопределено)' : (6 / dx) / (2 / dx);
        const regularized = 3.0;
        return { classical, regularized };
      },
      sliderMin: 1.0,
      sliderMax: 3.0,
      sliderStep: 0.01,
      defaultValue: 2.0
    },
    {
      id: 'A6',
      level: 'A6',
      name: 'Произведение нуля и бесконечности (0_F × ∞_G)',
      input: 'x => (5*x) * (3 / x)',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = 0 \\cdot \\infty \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0) = 0_5 \\times \\infty_3 = 15 \\quad (\\text{Точно})',
      safetyProtocol: 'A6_GENERAL (Унифицированная свертка)',
      explanation: 'Классическое произведение 0 * ∞ является одной из самых известных неопределенностей. В RICIS III свертка бесконечно малого порядка 0 и бесконечно большого порядка 0 с индексами F=5 и G=3 разрешается как произведение их весов. Результат равен 5 * 3 = 15.',
      derivationSteps: [
        'Индексация сомножителей: нуль имеет вес F=5, бесконечность имеет вес G=3',
        'Применение универсальной аксиомы A6_GENERAL: 0_F * ∞_G = F * G',
        'Умножение весов: 5 * 3 = 15',
        'Получение точного конечного выражения без предельных переходов'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '0 * ∞ (Неопределено)' : (5*x) * (3 / x);
        const regularized = 15.0;
        return { classical, regularized };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    },
    {
      id: 'A7',
      level: 'A7',
      name: 'Разность бесконечностей (∞_F - ∞_G)',
      input: 'x => (5 / x) - (3 / x)',
      point: 0.0,
      pointLabel: 'x = 0',
      classicalFormula: 'f(0) = \\infty - \\infty \\quad (\\text{Неопределено})',
      ricisFormula: 'f_{RICIS}(0, \\theta) = \\infty_2 \\quad (\\text{Регуляризовано в } \\frac{2x}{x^2 + \\theta^2})',
      safetyProtocol: 'A7_INFSUBINF',
      explanation: 'Разность бесконечностей в точке x = 0 дает классическую неопределенность. В RICIS III вычитание бесконечностей одного типа дает новую индексированную бесконечность ∞_{F-G}. Для весов F=5 и G=3 разность равна ∞_2. В регуляризованном поле это выражение переходит в гладкую функцию 2x/(x²+θ²), равную 0 на полюсе и ограниченную ±1/θ в окрестности.',
      derivationSteps: [
        'Определение бесконечностей: ∞_5 и ∞_3 при приближении к x=0',
        'Применение аксиомы A7_INFSUBINF: ∞_F - ∞_G = ∞_{F-G}',
        'Вычисление результирующего индекса: 5 - 3 = 2 -> результат ∞_2',
        'Перевод в регулярное поле: 2 / x -> 2x / (x^2 + theta^2), значение в нуле равно 0'
      ],
      compute: (x, t) => {
        const classical = Math.abs(x) < 1e-9 ? '∞ - ∞ (Неопределено)' : (5 / x) - (3 / x);
        const regularized = (2 * x) / (x * x + t * t);
        return { classical, regularized };
      },
      sliderMin: -1.0,
      sliderMax: 1.0,
      sliderStep: 0.01,
      defaultValue: 0.0
    }
  ];

  const currentCase = cases.find(c => c.id === selectedCase) || cases[0];
  const IconComponent = currentCase.icon;

  const currentTest = stressTests.find(t => t.id === selectedTest) || stressTests[0];

  // Run computation for interactive stress test
  const { classical: calcClassical, regularized: calcRegularized } = currentTest.compute(interactiveX, interactiveTheta);

  const handleTestSelection = (testId: string) => {
    setSelectedTest(testId);
    const test = stressTests.find(t => t.id === testId) || stressTests[0];
    setInteractiveX(test.defaultValue);
  };

  return (
    <div id="cases-solutions-root" className="bg-black/40 border border-white/10 rounded-xl p-6 text-slate-300 space-y-6 animate-fade-in">
      
      {/* Tab Selector */}
      <div className="flex border-b border-white/10 pb-4 justify-between items-center flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-950/30 border border-cyan-500/30 rounded">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white uppercase tracking-wider">
              Вычислительный Стенд RICIS III
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
              Теоретическая библиотека и интерактивная регуляризация сингулярностей
            </p>
          </div>
        </div>

        {/* Sub-tab buttons */}
        <div className="flex bg-black/40 border border-white/5 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('library')}
            className={`px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeSubTab === 'library'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Прикладные задачи
          </button>
          <button
            onClick={() => {
              setActiveSubTab('stressTests');
              // initialize matching default state
              const test = stressTests.find(t => t.id === selectedTest) || stressTests[0];
              setInteractiveX(test.defaultValue);
            }}
            className={`px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeSubTab === 'stressTests'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Символьный Стресс-Тест (Deep Stress Test)
          </button>
        </div>
      </div>

      {activeSubTab === 'library' ? (
        /* APPLIED CASES PANEL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cases List Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block mb-2">Выберите прикладную проблему</span>
            <div className="space-y-2">
              {cases.map((cs) => {
                const CaseIcon = cs.icon;
                const isSelected = cs.id === selectedCase;
                return (
                  <button
                    key={cs.id}
                    onClick={() => setSelectedCase(cs.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 flex items-center space-x-3 group relative overflow-hidden ${
                      isSelected 
                        ? 'bg-cyan-950/20 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(34,211,238,0.08)]' 
                        : 'bg-[#09090B]/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10 hover:bg-[#09090B]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                    )}
                    <div className={`p-1.5 rounded bg-[#09090B] border ${isSelected ? 'border-cyan-500/30 text-cyan-400' : 'border-white/5 text-slate-500 group-hover:text-slate-300'}`}>
                      <CaseIcon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">{cs.category}</span>
                      <span className="text-xs font-semibold block truncate mt-0.5">{cs.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Case Detail Panel */}
          <div className="lg:col-span-8 bg-[#09090B]/40 border border-white/5 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between space-y-6">
            {/* Ambient Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentCase.bgGlow} to-transparent rounded-full blur-3xl pointer-events-none opacity-40`} />

            <div className="space-y-6 relative">
              {/* Header of Detail */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block uppercase tracking-widest">{currentCase.category}</span>
                  <h3 className="text-base font-bold text-white mt-1">{currentCase.title}</h3>
                </div>
                <div className={`p-2.5 rounded-lg bg-[#09090B] border border-white/10 ${currentCase.colorClass}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>

              {/* Problem vs Solution Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classical Fail */}
                <div className="bg-red-950/10 border border-red-500/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-red-400 font-mono text-[10px] uppercase font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Классический коллапс</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[60px]">
                    {currentCase.classicalFail}
                  </p>
                  <div className="bg-[#09090B] p-2.5 rounded font-mono text-[11px] text-white text-center border border-white/5 whitespace-pre-wrap">
                    {currentCase.classicalFormula}
                  </div>
                </div>

                {/* RICIS Solution */}
                <div className="bg-cyan-950/10 border border-cyan-500/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono text-[10px] uppercase font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Регуляризация RICIS III</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[60px]">
                    {currentCase.ricisSolution}
                  </p>
                  <div className="bg-[#09090B] p-2.5 rounded font-mono text-[11px] text-cyan-300 text-center border border-cyan-950/60 whitespace-pre-wrap">
                    {currentCase.ricisFormula}
                  </div>
                </div>
              </div>

              {/* In-depth explanation */}
              <div className="bg-white/5 border border-white/5 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">Физический и Математический механизм</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentCase.explanation}
                </p>
              </div>

              {/* Execution Steps */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">Алгоритм доказательства и регуляризации</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentCase.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2 bg-[#09090B] p-2.5 rounded border border-white/5">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 w-5 h-5 rounded flex items-center justify-center shrink-0">
                        0{idx + 1}
                      </span>
                      <span className="text-xs text-slate-400 leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulate Call-to-action */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase">
                Параметры запуска: {Object.entries(currentCase.presetParams).map(([k, v]) => `${k}=${v}`).join(', ')}
              </div>
              <button
                onClick={() => onLoadPreset(currentCase.mode, currentCase.presetParams)}
                className="px-5 py-2.5 bg-cyan-500 text-[#09090B] rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 hover:bg-cyan-400 transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.35)] self-end sm:self-auto cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-[#09090B]" />
                <span>Запустить симуляцию</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SYMBOLIC DEEP STRESS TEST INTERACTIVE PANEL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Tests List Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block">Список стресс-тестов RICIS III</span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded">
                Символьное ядро v7.3
              </span>
            </div>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {stressTests.map((st) => {
                const isSelected = st.id === selectedTest;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleTestSelection(st.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${
                      isSelected 
                        ? 'bg-cyan-950/20 border-cyan-500/50 text-white shadow-[0_0_10px_rgba(34,211,238,0.05)]' 
                        : 'bg-[#09090B]/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${isSelected ? 'bg-cyan-500 text-[#09090B]' : 'bg-white/5 text-slate-400'}`}>
                        {st.level}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-medium block truncate text-slate-200 group-hover:text-white">{st.name}</span>
                        <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{st.input}</span>
                      </div>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Workbench Detail & Interactive Simulator */}
          <div className="lg:col-span-8 bg-[#09090B]/40 border border-white/5 rounded-xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative">
              {/* workbench header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-950/20 border border-cyan-500/30 rounded text-cyan-400">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">{currentTest.level} TEST PROFILE</span>
                      <span className="text-[9px] font-mono bg-white/5 text-slate-400 border border-white/10 px-1.5 rounded uppercase">
                        {currentTest.safetyProtocol}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{currentTest.name}</h3>
                  </div>
                </div>
              </div>

              {/* Symbolic / Analytical Equations comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classical Representation */}
                <div className="bg-red-950/10 border border-red-500/15 rounded-lg p-4 space-y-2">
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block">Классическое выражение</span>
                  <div className="font-mono text-[11px] text-slate-300 bg-[#09090B] p-2 rounded text-center border border-white/5">
                    {currentTest.input}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Сингулярная точка: <span className="text-red-400">{currentTest.pointLabel}</span>
                  </div>
                </div>

                {/* RICIS Regularized Analytical Representation */}
                <div className="bg-cyan-950/10 border border-cyan-500/15 rounded-lg p-4 space-y-2">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Регуляризованная аналитика RICIS</span>
                  <div className="font-mono text-[11px] text-cyan-300 bg-[#09090B] p-2 rounded text-center border border-cyan-950/50">
                    {currentTest.ricisFormula}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Квантовый регуляризатор: <span className="text-cyan-400">θ (theta)</span>
                  </div>
                </div>
              </div>

              {/* Explanation text */}
              <div className="bg-white/5 border border-white/5 rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">Физико-математическая суть и доказательство</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentTest.explanation}
                </p>
              </div>

              {/* Dynamic Workbench Simulator */}
              <div className="bg-black/40 border border-white/15 p-5 rounded-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Интерактивный вычислительный стенд</span>
                  <span className="text-[9px] font-mono text-slate-500">РЕАЛЬНОЕ ВРЕМЯ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sliders */}
                  <div className="space-y-4">
                    {/* Slider X */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Переменная x:</span>
                        <span className="text-white font-mono bg-[#09090B] px-1.5 py-0.5 rounded border border-white/5 font-semibold">
                          {interactiveX.toFixed(3)}
                        </span>
                      </div>
                      <input 
                        type="range"
                        min={currentTest.sliderMin}
                        max={currentTest.sliderMax}
                        step={currentTest.sliderStep}
                        value={interactiveX}
                        onChange={(e) => setInteractiveX(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                        <span>{currentTest.sliderMin}</span>
                        <span className="text-cyan-500/50">Полюс ({currentTest.pointLabel})</span>
                        <span>{currentTest.sliderMax}</span>
                      </div>
                    </div>

                    {/* Slider Theta */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Регуляризатор θ:</span>
                        <span className="text-cyan-400 font-mono bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-950/60 font-semibold">
                          {interactiveTheta.toFixed(3)}
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="0.00"
                        max="1.50"
                        step="0.01"
                        value={interactiveTheta}
                        onChange={(e) => setInteractiveTheta(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                        <span>0.00 (Сингулярность)</span>
                        <span>0.75</span>
                        <span>1.50 (Сглажено)</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time calculated Results Card */}
                  <div className="bg-[#09090B] border border-white/5 rounded-lg p-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Classical calculated result */}
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Классическое вычисление f(x):</span>
                        <span className={`text-xs font-mono font-bold ${calcClassical === '∞' || String(calcClassical).includes('Неопределено') ? 'text-red-400' : 'text-slate-300'}`}>
                          {typeof calcClassical === 'number' ? calcClassical.toFixed(5) : calcClassical}
                        </span>
                      </div>

                      {/* RICIS calculated result */}
                      <div className="flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">RICIS III Регуляризованное f_reg(x):</span>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {calcRegularized.toFixed(5)}
                        </span>
                      </div>
                    </div>

                    {/* Safety Status indicators */}
                    <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-slate-600 uppercase">Статус защиты ядра:</span>
                      {interactiveTheta > 0 ? (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                          SECURE / REGULARIZED
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-red-400 bg-red-950/30 border border-red-800/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          SINGULAR / NO REGU
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase and algorithm execution logs */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">Пошаговое символьное разложение (RICIS v7.3)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentTest.derivationSteps.map((step, idx) => (
                    <div key={idx} className="bg-[#09090B] p-2.5 rounded border border-white/5 flex items-start space-x-2.5">
                      <span className="text-[9px] font-mono bg-cyan-950/30 border border-cyan-800/40 text-cyan-400 w-5 h-5 rounded flex items-center justify-center shrink-0">
                        P{idx + 1}
                      </span>
                      <span className="text-xs text-slate-400 leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Simulated actions to load preset to parent */}
            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>Стресс-тест {currentTest.id} полностью интегрирован</span>
              <span>Класс: {currentTest.safetyProtocol}</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
