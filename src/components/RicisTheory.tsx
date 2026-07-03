/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Shield, Infinity, Cpu, Binary, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';

type TabType = 'foundations' | 'safety' | 'monoliths' | 'algorithm';

export default function RicisTheory() {
  const [activeTab, setActiveTab] = useState<TabType>('foundations');

  return (
    <div id="ricis-theory-root" className="bg-black/40 border border-white/10 rounded-xl p-6 text-slate-300 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-950/30 border border-cyan-500/30 rounded">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white uppercase tracking-wider">
              Парадигма RICIS III: Унифицированная Теория v7.7
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
              Strictly consistent singularity resolution framework
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Status: Logically Complete</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveTab('foundations')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
            activeTab === 'foundations'
              ? 'bg-cyan-950/30 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.05)]'
              : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Основы и Аксиомы
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
            activeTab === 'safety'
              ? 'bg-cyan-950/30 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.05)]'
              : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Протоколы Безопасности
        </button>
        <button
          onClick={() => setActiveTab('monoliths')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
            activeTab === 'monoliths'
              ? 'bg-cyan-950/30 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.05)]'
              : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Монолиты и Фракталы
        </button>
        <button
          onClick={() => setActiveTab('algorithm')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
            activeTab === 'algorithm'
              ? 'bg-cyan-950/30 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.05)]'
              : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Алгоритм Вычислений
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'foundations' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 bg-cyan-950/10 border border-cyan-500/20 rounded-lg">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">Абсолютные Основания (L0 и L1)</h3>
            <p className="text-xs leading-relaxed text-slate-300">
              Математический базис RICIS III v7.7 строится без предположений или гипотез превосходства, напрямую из онтологических тождеств. Любая математическая операция в окрестности сингулярности должна подчиняться двум фундаментальным принципам:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#09090B] p-4 border border-white/5 rounded">
                <span className="text-[10px] text-cyan-400 font-mono uppercase block tracking-wider">L0: Абсолютная Непрерывность</span>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ни один уровень рекурсии (включая фрактальные раскрытия, бесконечности <span className="font-mono text-white">∞_F</span> или нули <span className="font-mono text-white">0_F</span>) не допускает разрыва идентичности или потери непрерывности.
                </p>
              </div>
              <div className="bg-[#09090B] p-4 border border-white/5 rounded">
                <span className="text-[10px] text-cyan-400 font-mono uppercase block tracking-wider">L1: Закон Тождества</span>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  <span className="font-mono text-white">X = X</span> и <span className="font-mono text-white">X / X = 1</span> во всех случаях. Тип переменной <span className="font-mono text-white">T(X)</span> является неотъемлемой частью ее идентичности и сохраняется во всех преобразованиях.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Система Аксиом Неопределенностей v7.7</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
                <span className="text-[10px] text-amber-400 font-mono block uppercase">Аксиома A1 и A2 (Индексация)</span>
                <div className="bg-[#09090B] p-2.5 rounded font-mono text-xs text-white text-center border border-white/5">
                  F / 0 → ∞_F (F ≠ 0)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Деление ненулевого выражения F на 0 порождает индексированную бесконечность <span className="font-mono text-white">∞_F</span>. Для нулевого индекса <span className="font-mono text-white">∞_0 = 1</span>.
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
                <span className="text-[10px] text-amber-400 font-mono block uppercase">Аксиомы A4 и A5 (Деление)</span>
                <div className="bg-[#09090B] p-2.5 rounded font-mono text-xs text-white text-center border border-white/5">
                  0_F / 0_G = F / G &nbsp;|&nbsp; ∞_F / ∞_G = F / G
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Отношение сингулярных нулей или бесконечностей строго определяется как отношение их индексированных весов (алгебраических сомножителей).
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
                <span className="text-[10px] text-amber-400 font-mono block uppercase">Аксиома A6_GENERAL (Унифицированная)</span>
                <div className="bg-[#09090B] p-2.5 rounded font-mono text-xs text-white text-center border border-white/5">
                  0_F × ∞_G = F · G
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Универсальная свертка нуля и бесконечности. При равных весах <span className="font-mono text-white">F=G</span> дает конечное значение <span className="font-mono text-white">F²</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Type consistency */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-lg space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-cyan-400" />
              <span>Протокол Совместимости Типов (TypeConsistency Protocol)</span>
            </h4>
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
              <p>Вывод из L1C2 (Тип как Идентичность): Нельзя складывать сингулярности разных физических или математических пространств без морфизма.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#09090B] p-3 rounded border border-white/5">
                  <span className="font-semibold text-white block text-[10px] uppercase">Однородные T(F) = T(G)</span>
                  <span className="font-mono text-cyan-400 text-[11px] block mt-1">∞_5 + ∞_3 = ∞_8</span>
                </div>
                <div className="bg-[#09090B] p-3 rounded border border-white/5">
                  <span className="font-semibold text-white block text-[10px] uppercase">Совместимые T(F) ⊂ T(G)</span>
                  <span className="font-mono text-cyan-400 text-[11px] block mt-1">∞_5 + ∞_2x = ∞_(5+2x)</span>
                </div>
                <div className="bg-[#09090B] p-3 rounded border border-white/5">
                  <span className="font-semibold text-white block text-[10px] uppercase">Несовместимые типы</span>
                  <span className="font-mono text-rose-400 text-[11px] block mt-1">∞_Time + ∞_Space = Monolith</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-lg">
            <span className="text-[10px] text-amber-400 font-mono block uppercase font-bold tracking-wider mb-1">Защита от парадоксов</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Без строгих правил локальности можно ложно доказать равенство <span className="font-mono text-white">1 = 10</span> или стереть информацию при раскрытии сингулярных дробей. RICIS III вводит 4 обязательных правила безопасности (Safety Protocols).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/5 p-5 rounded-lg space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">SP1: Локальность (No Total Amnesia)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                При возникновении неопределенности <span className="font-mono text-white">0/0</span> запрещено заменять выражение целиком на единицу. Тождество <span className="font-mono text-white">X/X = 1</span> применяется исключительно к идентичным нулевым множителям. Остальная алгебраическая часть («хвост») остается неизменной.
              </p>
              <div className="bg-[#09090B] p-3 rounded border border-white/5 font-mono text-[11px] text-slate-300">
                (x - 5)(x + 5) / (x - 5) &nbsp;→&nbsp; (1) · (x + 5)
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-5 rounded-lg space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">SP2: Приоритет Сокращения (Clean First)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Алгебраическое упрощение и сокращение идентичных неопределенных множителей должно выполняться ДО вычисления сингулярных аксиом. Это предотвращает появление «ложных нулей», скрывающих истинный предел.
              </p>
              <div className="bg-[#09090B] p-3 rounded border border-white/5 font-mono text-[11px] text-slate-300">
                lim(x→a) f(x) &nbsp;→&nbsp; Сначала сокращаем, потом подставляем
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-5 rounded-lg space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">SP3: Закон Весов (Weight of Zero)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Если аналитическое сокращение невозможно, отношение <span className="font-mono text-white">0/0</span> строго определяется отношением числовых весов или индексов: <span className="font-mono text-white">0_F / 0_G = F / G</span>. Приравнивать нули разной природы к скалярной единице без учета весов запрещено.
              </p>
              <div className="bg-[#09090B] p-3 rounded border border-white/5 font-mono text-[11px] text-slate-300">
                0_8 / 0_2 = 4 &nbsp;(а не 1)
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-5 rounded-lg space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">SP4: Семантический Приоритет</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Индексация сингулярности в точке <span className="font-mono text-white">x = a</span> должна осуществляться по исходному выражению <span className="font-mono text-white">E(x)</span>, а не по его мгновенному числовому значению. Это сохраняет структуру для раскрытия по SP2.
              </p>
              <div className="bg-[#09090B] p-3 rounded border border-white/5 font-mono text-[11px] text-slate-300">
                0_&#123;(x²-4)|_&#123;x=2&#125;&#125; ,&nbsp; но НЕ 0_&#123;(4-4)&#125;
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monoliths' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-lg space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Иерархия Монолитов RICIS III</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Монолит — это алгебраически замкнутый многомерный класс объектов, устойчивых к действию сингулярных операторов. Иерархия монолитов описывает усложнение структур:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
              <span className="font-mono text-xs text-cyan-400">Порядок 0 (Point)</span>
              <h5 className="font-bold text-white text-xs uppercase">Атомарный Монолит</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Чистые элементарные идентичности: <span className="font-mono text-white">F</span>, <span className="font-mono text-white">∞_F</span>, <span className="font-mono text-white">0_F</span>. Внутренняя структура отсутствует.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
              <span className="font-mono text-xs text-cyan-400">Порядок 1 (Line)</span>
              <h5 className="font-bold text-white text-xs uppercase">Линейный Монолит</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Суперпозиция и композиции атомарных объектов порядка 0, замкнутые относительно RICIS-преобразований.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
              <span className="font-mono text-xs text-cyan-400">Порядок 2 (Plane)</span>
              <h5 className="font-bold text-white text-xs uppercase">Плоский Монолит</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Многомерные системы взаимосвязанных монолитов, поддерживающие непрерывное фрактальное раскрытие.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
              <span className="font-mono text-xs text-cyan-400">Порядок 3 (Volume)</span>
              <h5 className="font-bold text-white text-xs uppercase">Объемный Монолит</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Самоорганизующаяся сингулярная система с автономной внутренней навигацией и балансом сил.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#09090B] border border-white/5 rounded-lg space-y-2">
            <span className="text-[10px] text-cyan-400 font-mono block uppercase tracking-wider">Фрактальный Закон Сохранения (Fractal Law)</span>
            <div className="bg-white/5 p-3 rounded font-mono text-xs text-center border border-white/5 text-white">
              R(Q) = &#123; Q, T(Q), ∞_Q, 0_Q, R(∞_Q), R(0_Q) &#125;
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Каждый сингулярный элемент содержит в себе структуру всей системы в свернутом виде. Фрактальное развертывание гарантирует, что при сколь угодно глубоком раздутии геометрического узла информационная целостность и энтропийные веса исходной матрицы сохраняются на 100%.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'algorithm' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-lg">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">9-Фазовый Вычислительный Алгоритм</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Вычисления по парадигме RICIS III выполняются строго пошагово. Замена неопределенностей классических пределов (limits) на точные алгебраические преобразования исключает сингулярные катастрофы:
            </p>
          </div>

          {/* Stepper algorithm */}
          <div className="space-y-3 relative border-l border-white/5 pl-4 ml-2">
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Фаза -1 &bull; L1 Инициализация</span>
              <p className="text-xs text-slate-400">Определяем онтологическую идентичность и типы <span className="font-mono text-slate-300">T(X)</span> всех переменных.</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Фаза 0 &bull; Устранение пределов</span>
              <p className="text-xs text-slate-400">Избавляемся от оператора <span className="font-mono text-slate-300">lim(x→a)</span>, переводя вычисления в прямую подстановку <span className="font-mono text-slate-300">x = a</span>.</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Фаза 0.5 &bull; Семантическая индексация (SP4)</span>
              <p className="text-xs text-slate-400">Индексируем нули выражением, сохраняя их внутреннюю структуру в точке разрыва.</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Фаза 1 &bull; Проверка Безопасности (SP2)</span>
              <p className="text-xs text-slate-400">Осуществляем алгебраическое сокращение сомножителей до раскрытия числовых значений.</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Фаза 2 &bull; RICIS Трансформация</span>
              <p className="text-xs text-slate-400">Применяем аксиомы свертки: <span className="font-mono text-slate-300">F/0 = ∞_F</span>, <span className="font-mono text-slate-300">0_F/0_G = F/G</span>, <span className="font-mono text-slate-300">0_F × ∞_G = F·G</span>.</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Фазы 3-6 &bull; Протоколирование и Верификация</span>
              <p className="text-xs text-slate-400">Проводим типизацию, финальные вычисления и контроль сохранения тождества L1.</p>
            </div>
          </div>

          <div className="p-4 bg-[#09090B] border border-white/5 rounded-lg space-y-3">
            <span className="text-[10px] text-cyan-400 font-mono block uppercase tracking-wider">Примеры Свертки Сингулярностей</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-mono text-white">
              <div className="bg-white/5 p-2 rounded border border-white/5">
                5 / 0 &nbsp;=&nbsp; ∞_5
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                0_5 × ∞_5 &nbsp;=&nbsp; 25
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                0_5 × ∞_3 &nbsp;=&nbsp; 15
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                0_8 / 0_2 &nbsp;=&nbsp; 4
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Philosophy footer */}
      <div className="bg-white/5 border border-white/5 rounded-lg p-5 flex items-start gap-4">
        <Cpu className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-white text-xs font-semibold uppercase tracking-wider">Совместимость с Классической Математикой</span>
          <p className="text-xs text-slate-400 leading-relaxed">
            RICIS III не заменяет и не отвергает классический анализ — она является его расширением там, где классические методы выдают ошибку деления на ноль. Вне сингулярностей регуляризованные операторы дают результаты, на 100% совпадающие с Ньютоном-Лейбницем, гарантируя абсолютную совместимость.
          </p>
        </div>
      </div>
    </div>
  );
}
