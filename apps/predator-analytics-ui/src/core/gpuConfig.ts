/**
 * GPU Performance Budget для RTX 3050 (4GB VRAM)
 * 
 * Ціль: стабільні 60 FPS при WebGL-рендерингу 3D-сцени.
 * VRAM бюджет:
 *   ~1.5 GB — текстури моделей + skybox
 *   ~0.5 GB — рендер-буфери (post-processing, shadow maps)
 *   ~0.3 GB — геометрія графу + іскри
 *   ~0.2 GB — запас для ОС / браузер overhead
 *   Разом: ~2.5 GB з 4 GB — залишається запас.
 */

export const GPU_CONFIG = {
  /** Максимальна кількість одночасних іскор у VoidForge */
  MAX_SPARKS: 200,

  /** Кількість іскор за один удар молота */
  SPARKS_PER_STRIKE: 15,

  /** Зменшена кількість іскор при високому навантаженні (>150 активних) */
  SPARKS_PER_STRIKE_LOW: 8,

  /** Поріг для зниження кількості іскор */
  SPARK_LOW_THRESHOLD: 150,

  /** Час життя іскри (мс) перед auto-cleanup */
  SPARK_LIFETIME_MS: 1500,

  /** Максимальна кількість нод графу для рендеру */
  MAX_GRAPH_NODES: 500,

  /** Максимальна кількість зв'язків з частинками */
  MAX_PARTICLE_LINKS: 100,

  /** Canvas Device Pixel Ratio — обмеження для RTX 3050 */
  DPR_RANGE: [1, 1.5] as [number, number],

  /** Multisampling — 2 замість 4 для економії VRAM */
  MULTISAMPLING: 2,

  /** SSAO samples — 16 замість 31 */
  SSAO_SAMPLES: 16,

  /** Сегменти сфер для нод графу (замість 32x32) */
  SPHERE_SEGMENTS: 12,

  /** Мінімальний поріг продуктивності для автоматичної деградації */
  PERFORMANCE_MIN: 0.5,

  /** WebGL Power Preference */
  POWER_PREFERENCE: 'high-performance' as WebGLPowerPreference,

  /** Bloom — обмежити кількість mipmap рівнів */
  BLOOM_MIP_LEVELS: 5,

  /** Максимальний розмір текстури для завантажених моделей */
  MAX_TEXTURE_SIZE: 2048,
} as const;

export type GPUConfig = typeof GPU_CONFIG;
