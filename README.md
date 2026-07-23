# 🧮 Онлайн-калькулятор RICIS 7.7 (Recursive Indexed Calculus of Identity and Singularity)

[![GitHub License](https://img.shields.io/github/license/A1Dmitry/RICIS-7.7-online-calculator)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/A1Dmitry/RICIS-7.7-online-calculator)](https://github.com/A1Dmitry/RICIS-7.7-online-calculator/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/A1Dmitry/RICIS-7.7-online-calculator)](https://github.com/A1Dmitry/RICIS-7.7-online-calculator/issues)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21491712.svg)](https://doi.org/10.5281/zenodo.21491712)

**Интерактивный веб-инструмент для вычислений с индексированными сингулярностями, регуляризации градиентных взрывов и доказательства математических теорем по методологии RICIS-III.**

🌐 **Демо / Онлайн-версия:** [Открыть калькулятор](https://a1dmitry.github.io/RICIS-7.7-online-calculator/)  
📄 **Препринт:** [DOI: 10.5281/zenodo.21491712](https://doi.org/10.5281/zenodo.21491712)

---

## 📌 Основные возможности

- **Вычисления с индексированными сингулярностями**  
  Поддержка операций с типизированными нулями \(0_F\) и индексированными бесконечностями \(\infty_F\) согласно аксиомам RICIS-III (A1–A10).

- **Регуляризация градиентного взрыва (LLM)**  
  Реализация гладкого оператора \(R_\theta(g) = g / (1 + (g \cdot \theta)^2)\) для замены Gradient Clipping в глубоких нейросетях.

- **Математическое доказательство теорем**  
  Встроенный модуль символьной верификации для разрешения неопределённостей вида \(0/0\) и \(0 \times \infty\).

- **Интерактивный симулятор обучения LLM**  
  Визуализация градиентного потока через слои Transformer с применением RICIS-регуляризации.

- **Кроссплатформенность**  
  Работает в любом современном браузере на ПК, планшетах и смартфонах.

- **Автономность**  
  Все вычисления выполняются на стороне клиента (Client-side). Данные не передаются на внешние серверы.

---

## 🚀 Быстрый старт

### 1. Локальный запуск

```bash
git clone https://github.com/A1Dmitry/RICIS-7.7-online-calculator.git
cd RICIS-7.7-online-calculator
Откройте index.html в любом современном браузере.

2. Интеграция в проект
html
<script src="ricis-core.js"></script>
<script>
  const result = Ricis.evaluate('0_5 * ∞_3');
  console.log(result); // 15
</script>
3. Использование через API
javascript
import { Ricis } from '@ricis/core';

const ctx = Ricis.analyze('(x^2 - 4)/(x - 2) at x=2');
console.log(ctx.result); // 4
🛠 Технологии
Компонент	Технология
Фронтенд	HTML5 / CSS3 / JavaScript (ES6+)
Символьные вычисления	Expression Trees, BigInt
Регуляризация градиентов	PyTorch Autograd (экспорт)
Деплой	GitHub Pages
📊 Модули калькулятора
Модуль	Назначение	Состояние
Арифметика RICIS	Операции с 
0
F
0 
F
​
 , 
∞
F
∞ 
F
​
 , A4, A6	✅ Работает
Регуляризация LLM	
R
θ
(
g
)
R 
θ
​
 (g) для градиентов	✅ Работает
Доказательство теорем	Символьная верификация	✅ Работает
Симулятор обучения	Визуализация градиентного потока	🧪 Бета
Экспорт в LaTeX	Генерация TeX-отчётов	📋 Планируется
🔍 SEO & Ключевые слова
Этот репозиторий оптимизирован для поиска по запросам:

text
RICIS 7.7, РИЦИС 7.7, онлайн калькулятор RICIS, регуляризация градиентов, Gradient Clipping, LLM, устранение сингулярностей, индексированная бесконечность, типизированный ноль, A6_GENERAL, математические доказательства, символьные вычисления, Deep Learning, PyTorch, RICIS-III, Recursive Indexed Calculus, Singularity Resolution, 0/0 = 1, 0_F × ∞_G = F·G
🤝 Вклад в разработку (Contributing)
Приглашаем к участию в развитии проекта!

Сделайте Fork репозитория.

Создайте ветку для новой функции:
git checkout -b feature/AmazingFeature

Сделайте коммит изменений:
git commit -m 'Add some AmazingFeature'

Выполните Push в ветку:
git push origin feature/AmazingFeature

Откройте Pull Request.

📚 Связанные публикации
[DOI: 10.5281/zenodo.17872755] — RICIS-III: Recursive Indexed Calculus of Identity and Singularity — Complete Proofs of the Seven Millennium Problems and Navier–Stokes.

[DOI: 10.5281/zenodo.21491712] — Гладкая регуляризация градиентного взрыва и устранение неопределённостей в LLM на основе RICIS-III.

[DOI: 10.5281/zenodo.18001299] — Functional Decipherment of the Voynich Manuscript: A Vector-Oriented Mechanical Forth Implementation.

📝 Лицензия
Проект распространяется под лицензией MIT. Подробности в файле LICENSE.

👤 Автор
Дмитрий Алейников

ORCID: 0009-0004-3226-7700

Telegram: Expansion of mathematics

LinkedIn: Dmitry Aleinikov
