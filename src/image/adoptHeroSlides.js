/**
 * 领养中心顶部轮播：使用 src/image/pet-1.png ~ pet-7.png（与文件名一致）
 */
import pet1 from './pet-1.png';
import pet2 from './pet-2.png';
import pet3 from './pet-3.png';
import pet4 from './pet-4.png';
import pet5 from './pet-5.png';
import pet6 from './pet-6.png';
import pet7 from './pet-7.png';

export const ADOPT_HERO_SLIDES = [
  {
    image: pet1,
    title: '守护流浪生命，领养代替购买',
    subtitle: '用选择传递善意，让救助有始有终',
  },
  {
    image: pet2,
    title: '每一个小生命，都值得被温柔以待',
    subtitle: '不伤害、不遗弃，从日常点滴做起',
    // 主体偏上，避免 cover 居中裁切时切掉眼部
    objectPosition: 'center 18%',
  },
  {
    image: pet3,
    title: '用爱终止流浪，给 TA 一个家',
    subtitle: '领养是一份承诺，更是一段陪伴',
  },
  {
    image: pet4,
    title: '保护动物，从了解与尊重开始',
    subtitle: '科学养宠、文明相处，共建友好社区',
  },
  {
    image: pet5,
    title: '善待动物，就是善待我们自己',
    subtitle: '地球不只属于人类，也与它们共享',
  },
  {
    image: pet6,
    title: '拒绝遗弃，责任养宠一生',
    subtitle: '养前想清楚，养后负责到底',
  },
  {
    image: pet7,
    title: '携手救助，让更多毛孩子遇见光',
    subtitle: '关注流浪动物，支持正规救助与领养',
  },
];
