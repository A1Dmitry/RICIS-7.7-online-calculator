/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Shield, Infinity, Cpu, Binary, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

type TabType = 'foundations' | 'safety' | 'monoliths' | 'algorithm';

export default function RicisTheory() {
  const [activeTab, setActiveTab] = useState<TabType>('foundations');
  const { t } = useLanguage();

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
              {t('Парадигма RICIS III: Унифицированная Теория v7.7', 'RICIS III Paradigm: Unified Theory v7.7')}
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
          {t('Основы и Аксиомы', 'Foundations & Axioms')}
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
            activeTab === 'safety'
              ? 'bg-cyan-950/30 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.05)]'
              : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {t('Протоколы Безопасности', 'Safety Protocols')}
        </button>
        <button
          onClick={() => setActiveTab('monoliths')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
            activeTab === 'monoliths'
              ? 'bg-cyan-950/30 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.05)]'
              : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {t('Монолиты и Фракталы', 'Monoliths & Fractals')}
        </button>
        <button
          onClick={() => setActiveTab('algorithm')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all duration-200 ${
            activeTab === 'algorithm'
              ? 'bg-cyan-950/30 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(34,211,238,0.05)]'
              : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {t('Алгоритм Вычислений', 'Computation Algorithm')}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'foundations' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 bg-cyan-950/10 border border-cyan-500/20 rounded-lg">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">{t('Абсолютные Основания (L0 и L1)', 'Absolute Foundations (L0 and L1)')}</h3>
            <p className="text-xs leading-relaxed text-slate-300">
              {t('Математический базис RICIS III v7.7 строится без предположений или гипотез превосходства, напрямую из онтологических тождеств. Любая математическая операция в окрестности сингулярности должна подчиняться двум фундаментальным принципам:', 'The mathematical basis of RICIS III v7.7 is built without assumptions or superiority hypotheses, directly from ontological identities. Any mathematical operation in the neighborhood of a singularity must obey two fundamental principles:')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#09090B] p-4 border border-white/5 rounded">
                <span className="text-[10px] text-cyan-400 font-mono uppercase block tracking-wider">{t('L0: Абсолютная Непрерывность', 'L0: Absolute Continuity')}</span>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t('Ни один уровень рекурсии (включая фрактальные раскрытия, бесконечности ∞_F или нули 0_F) не допускает разрыва идентичности или потери непрерывности.', 'No level of recursion (including fractal unfoldings, infinities ∞_F or zeros 0_F) permits discontinuity or identity loss.')}
                </p>
              </div>
              <div className="bg-[#09090B] p-4 border border-white/5 rounded">
                <span className="text-[10px] text-cyan-400 font-mono uppercase block tracking-wider">{t('L1: Закон Тождества', 'L1: Law of Identity')}</span>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t('X = X и X / X = 1 во всех случаях. Тип переменной T(X) является неотъемлемой частью ее идентичности и сохраняется во всех преобразованиях.', 'X = X and X / X = 1 in all cases. The variable type T(X) is an integral part of its identity and is preserved in all transformations.')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">{t('Система Аксиом Неопределенностей v7.7', 'Indeterminate Singularity Axiom System v7.7')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
                <span className="text-[10px] text-amber-400 font-mono block uppercase">{t('Аксиома A1 и A2 (Индексация)', 'Axiom A1 & A2 (Indexing)')}</span>
                <div className="bg-[#09090B] p-2.5 rounded font-mono text-xs text-white text-center border border-white/5">
                  F / 0 → ∞_F (F ≠ 0)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('Деление ненулевого выражения F на 0 порождает индексированную бесконечность ∞_F. Для нулевого индекса ∞_0 = 1.', 'Dividing a non-zero expression F by 0 yields an indexed infinity ∞_F. For zero index, ∞_0 = 1.')}
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
                <span className="text-[10px] text-amber-400 font-mono block uppercase">{t('Аксиомы A4 и A5 (Деление)', 'Axioms A4 & A5 (Division)')}</span>
                <div className="bg-[#09090B] p-2.5 rounded font-mono text-xs text-white text-center border border-white/5">
                  0_F / 0_G = F / G &nbsp;|&nbsp; ∞_F / ∞_G = F / G
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('Отношение сингулярных нулей или бесконечностей строго определяется как отношение их индексированных весов (алгебраических сомножителей).', 'The ratio of singular zeros or infinities is strictly defined as the ratio of their indexed weights (algebraic factors).')}
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
                <span className="text-[10px] text-amber-400 font-mono block uppercase">{t('Аксиома A6_GENERAL (Унифицированная)', 'Axiom A6_GENERAL (Unified)')}</span>
                <div className="bg-[#09090B] p-2.5 rounded font-mono text-xs text-white text-center border border-white/5">
                  0_F × ∞_G = F · G
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('Универсальная свертка нуля и бесконечности. При равных весах F=G дает конечное значение F².', 'Universal convolution of zero and infinity. With equal weights F=G, it yields the finite value F².')}
                </p>
              </div>
            </div>
          </div>

          {/* Type consistency */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-lg space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Binary className="w-4 h-4 text-cyan-400" />
              <span>{t('Протокол Совместимости Типов (TypeConsistency Protocol)', 'TypeConsistency Protocol (Type Compatibility)')}</span>
            </h4>
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
              <p>{t('Вывод из L1C2 (Тип как Идентичность): Нельзя складывать сингулярности разных физических или математических пространств без морфизма.', 'Inference from L1C2 (Type as Identity): One cannot add singularities of different physical or mathematical spaces without a morphism.')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#09090B] p-3 rounded border border-white/5">
                  <span className="font-semibold text-white block text-[10px] uppercase">{t('Однородные T(F) = T(G)', 'Homogeneous T(F) = T(G)')}</span>
                  <span className="font-mono text-cyan-400 text-[11px] block mt-1">∞_5 + ∞_3 = ∞_8</span>
                </div>
                <div className="bg-[#09090B] p-3 rounded border border-white/5">
                  <span className="font-semibold text-white block text-[10px] uppercase">{t('Совместимые T(F) ⊂ T(G)', 'Compatible T(F) ⊂ T(G)')}</span>
                  <span className="font-mono text-cyan-400 text-[11px] block mt-1">∞_5 + ∞_2x = ∞_(5+2x)</span>
                </div>
                <div className="bg-[#09090B] p-3 rounded border border-white/5">
                  <span className="font-semibold text-white block text-[10px] uppercase">{t('Несовместимые типы', 'Incompatible types')}</span>
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
            <span className="text-[10px] text-amber-400 font-mono block uppercase font-bold tracking-wider mb-1">{t('Защита от парадоксов', 'Protection from Paradoxes')}</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('Без строгих правил локальности можно ложно доказать равенство 1 = 10 или стереть информацию при раскрытии сингулярных дробей. RICIS III вводит 4 обязательных правила безопасности (Safety Protocols).', 'Without strict locality rules, one could falsely prove 1 = 10 or erase information when resolving singular fractions. RICIS III introduces 4 mandatory safety rules (Safety Protocols).')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/5 p-5 rounded-lg space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">{t('SP1: Локальность (No Total Amnesia)', 'SP1: Locality (No Total Amnesia)')}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('При возникновении неопределенности 0/0 запрещено заменять выражение целиком на единицу. Тождество X/X = 1 применяется исключительно к идентичным нулевым множителям. Остальная алгебраическая часть («хвост») остается неизменной.', 'When a 0/0 indeterminacy occurs, it is forbidden to replace the entire expression with 1. The identity X/X = 1 is applied exclusively to identical zero factors. The remaining algebraic part (the "tail") remains unchanged.')}
              </p>
              <div className="bg-[#09090B] p-3 rounded border border-white/5 font-mono text-[11px] text-slate-300">
                (x - 5)(x + 5) / (x - 5) &nbsp;→&nbsp; (1) · (x + 5)
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-5 rounded-lg space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">{t('SP2: Приоритет Сокращения (Clean First)', 'SP2: Reduction Priority (Clean First)')}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('Алгебраическое упрощение и сокращение идентичных неопределенных множителей должно выполняться ДО вычисления сингулярных аксиом. Это предотвращает появление «ложных нулей», скрывающих истинный предел.', 'Algebraic simplification and reduction of identical indeterminate factors must be performed BEFORE computing singularity axioms. This prevents "false zeros" from obscuring the true limit.')}
              </p>
              <div className="bg-[#09090B] p-3 rounded border border-white/5 font-mono text-[11px] text-slate-300">
                {t('lim(x→a) f(x)  →  Сначала сокращаем, потом подставляем', 'lim(x→a) f(x)  →  Simplify first, substitute after')}
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-5 rounded-lg space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">{t('SP3: Закон Весов (Weight of Zero)', 'SP3: Weight of Zero (Law of Weights)')}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('Если аналитическое сокращение невозможно, отношение 0/0 строго определяется отношением числовых весов или индексов: 0_F / 0_G = F / G. Приравнивать нули разной природы к скалярной единице без учета весов запрещено.', 'If analytical cancellation is impossible, the 0/0 ratio is strictly defined by the ratio of numerical weights or indices: 0_F / 0_G = F / G. Equating zeros of different nature to a scalar unit without considering their weights is forbidden.')}
              </p>
              <div className="bg-[#09090B] p-3 rounded border border-white/5 font-mono text-[11px] text-slate-300">
                0_8 / 0_2 = 4 &nbsp;{t('(а не 1)', '(not 1)')}
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-5 rounded-lg space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">{t('SP4: Семантический Приоритет', 'SP4: Semantic Priority')}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('Индексация сингулярности в точке x = a должна осуществляться по исходному выражению E(x), а не по его мгновенному числовому значению. Это сохраняет структуру для раскрытия по SP2.', 'Singularity indexing at x = a must be done by the original expression E(x), rather than its instantaneous numerical value. This preserves the structure for SP2 resolution.')}
              </p>
              <div className="bg-[#09090B] p-3 rounded border border-white/5 font-mono text-[11px] text-slate-300">
                0_&#123;(x²-4)|_&#123;x=2&#125;&#125; ,&nbsp; {t('но НЕ', 'but NOT')} 0_&#123;(4-4)&#125;
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
              <span>{t('Иерархия Монолитов RICIS III', 'RICIS III Monolith Hierarchy')}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('Монолит — это алгебраически замкнутый многомерный класс объектов, устойчивых к действию сингулярных операторов. Иерархия монолитов описывает усложнение структур:', 'A monolith is an algebraically closed multidimensional class of objects resistant to the action of singular operators. The monolith hierarchy describes the increasing complexity of structures:')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
              <span className="font-mono text-xs text-cyan-400">{t('Порядок 0 (Point)', 'Order 0 (Point)')}</span>
              <h5 className="font-bold text-white text-xs uppercase">{t('Атомарный Монолит', 'Atomic Monolith')}</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('Чистые элементарные идентичности: F, ∞_F, 0_F. Внутренняя структура отсутствует.', 'Pure elementary identities: F, ∞_F, 0_F. No internal structure is present.')}
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
              <span className="font-mono text-xs text-cyan-400">{t('Порядок 1 (Line)', 'Order 1 (Line)')}</span>
              <h5 className="font-bold text-white text-xs uppercase">{t('Линейный Монолит', 'Linear Monolith')}</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('Суперпозиция и композиции атомарных объектов порядка 0, замкнутые относительно RICIS-преобразований.', 'Superposition and compositions of Order 0 atomic objects, closed under RICIS transformations.')}
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
              <span className="font-mono text-xs text-cyan-400">{t('Порядок 2 (Plane)', 'Order 2 (Plane)')}</span>
              <h5 className="font-bold text-white text-xs uppercase">{t('Плоский Монолит', 'Planar Monolith')}</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('Многомерные системы взаимосвязанных монолитов, поддерживающие непрерывное фрактальное раскрытие.', 'Multidimensional systems of interconnected monoliths, supporting continuous fractal unfolding.')}
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-lg space-y-2">
              <span className="font-mono text-xs text-cyan-400">{t('Порядок 3 (Volume)', 'Order 3 (Volume)')}</span>
              <h5 className="font-bold text-white text-xs uppercase">{t('Объемный Монолит', 'Volume Monolith')}</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('Самоорганизующаяся сингулярная система с автономной внутренней навигацией и балансом сил.', 'Self-organizing singular system with autonomous internal navigation and balance of forces.')}
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#09090B] border border-white/5 rounded-lg space-y-2">
            <span className="text-[10px] text-cyan-400 font-mono block uppercase tracking-wider">{t('Фрактальный Закон Сохранения (Fractal Law)', 'Fractal Law of Preservation (Fractal Law)')}</span>
            <div className="bg-white/5 p-3 rounded font-mono text-xs text-center border border-white/5 text-white">
              R(Q) = &#123; Q, T(Q), ∞_Q, 0_Q, R(∞_Q), R(0_Q) &#125;
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('Каждый сингулярный элемент содержит в себе структуру всей системы в свернутом виде. Фрактальное развертывание гарантирует, что при сколь угодно глубоком раздутии геометрического узла информационная целостность и энтропийные веса исходной матрицы сохраняются на 100%.', 'Each singular element contains the structure of the entire system in folded form. Fractal unfolding guarantees that at arbitrarily deep swelling of the geometric node, the information integrity and entropy weights of the original matrix are 100% preserved.')}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'algorithm' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-lg">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">{t('9-Фазовый Вычислительный Алгоритм', '9-Phase Computational Algorithm')}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('Вычисления по парадигме RICIS III выполняются строго пошагово. Замена неопределенностей классических пределов (limits) на точные алгебраические преобразования исключает сингулярные катастрофы:', 'Computations under the RICIS III paradigm are executed strictly step-by-step. Replacing indeterminacies of classical limits with precise algebraic transformations eliminates singular catastrophes:')}
            </p>
          </div>

          {/* Stepper algorithm */}
          <div className="space-y-3 relative border-l border-white/5 pl-4 ml-2">
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">{t('Фаза -1 &bull; L1 Инициализация', 'Phase -1 &bull; L1 Initialization')}</span>
              <p className="text-xs text-slate-400">{t('Определяем онтологическую идентичность и типы T(X) всех переменных.', 'Define the ontological identity and types T(X) of all variables.')}</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">{t('Фаза 0 &bull; Устранение пределов', 'Phase 0 &bull; Elimination of Limits')}</span>
              <p className="text-xs text-slate-400">{t('Избавляемся от оператора lim(x→a), переводя вычисления в прямую подстановку x = a.', 'Eliminate the lim(x→a) operator, transferring calculations to direct substitution x = a.')}</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">{t('Фаза 0.5 &bull; Семантическая индексация (SP4)', 'Phase 0.5 &bull; Semantic Indexing (SP4)')}</span>
              <p className="text-xs text-slate-400">{t('Индексируем нули выражением, сохраняя их внутреннюю структуру в точке разрыва.', 'Index zeros with the parent expression, preserving their internal structure at the discontinuity.')}</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">{t('Фаза 1 &bull; Проверка Безопасности (SP2)', 'Phase 1 &bull; Safety Check (SP2)')}</span>
              <p className="text-xs text-slate-400">{t('Осуществляем алгебраическое сокращение сомножителей до раскрытия числовых значений.', 'Perform algebraic reduction of factors before numeric values are unfolded.')}</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">{t('Фаза 2 &bull; RICIS Трансформация', 'Phase 2 &bull; RICIS Transformation')}</span>
              <p className="text-xs text-slate-400">{t('Применяем аксиомы свертки: F/0 = ∞_F, 0_F/0_G = F/G, 0_F × ∞_G = F·G.', 'Apply convolution axioms: F/0 = ∞_F, 0_F/0_G = F/G, 0_F × ∞_G = F·G.')}</p>
            </div>
            <div className="space-y-1 relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#09090B]"></div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">{t('Фазы 3-6 &bull; Протоколирование и Верификация', 'Phases 3-6 &bull; Logging and Verification')}</span>
              <p className="text-xs text-slate-400">{t('Проводим типизацию, финальные вычисления и контроль сохранения тождества L1.', 'Execute typing, final calculations, and control verification of the L1 identity preservation.')}</p>
            </div>
          </div>

          <div className="p-4 bg-[#09090B] border border-white/5 rounded-lg space-y-3">
            <span className="text-[10px] text-cyan-400 font-mono block uppercase tracking-wider">{t('Примеры Свертки Сингулярностей', 'Examples of Singularity Convolutions')}</span>
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
          <span className="text-white text-xs font-semibold uppercase tracking-wider">{t('Совместимость с Классической Математикой', 'Compatibility with Classical Mathematics')}</span>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('RICIS III не заменяет и не отвергает классический анализ — она является его расширением там, где классические методы выдают ошибку деления на ноль. Вне сингулярностей регуляризованные операторы дают результаты, на 100% совпадающие с Ньютоном-Лейбницем, гарантируя абсолютную совместимость.', 'RICIS III does not replace or reject classical analysis — it is its extension where classical methods yield a division-by-zero error. Outside of singularities, the regularized operators yield results 100% consistent with Newton-Leibniz, guaranteeing absolute compatibility.')}
          </p>
        </div>
      </div>
    </div>
  );
}
