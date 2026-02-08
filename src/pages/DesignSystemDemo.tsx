import React from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardHeader, CardBody, IconBadge, Badge } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem } from '@/utils/animations';
import './DesignSystemDemo.css';

const DesignSystemDemo: React.FC = () => {
  return (
    <div className="design-demo">
      <div className="design-demo__container">
        {/* 标题 */}
        <motion.div
          className="design-demo__header"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <h1 className="design-demo__title">🎨 设计系统展示</h1>
          <p className="design-demo__subtitle">低饱和复古色 · 简洁优雅</p>
        </motion.div>

        {/* 按钮展示 */}
        <motion.section
          className="design-demo__section"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.h2 className="design-demo__section-title" variants={staggerItem}>
            按钮组件
          </motion.h2>
          
          <motion.div className="design-demo__grid" variants={staggerItem}>
            <Button variant="primary">主要按钮</Button>
            <Button variant="secondary">次要按钮</Button>
            <Button variant="ghost">幽灵按钮</Button>
            <Button variant="outline">轮廓按钮</Button>
          </motion.div>

          <motion.div className="design-demo__grid" variants={staggerItem}>
            <Button variant="primary" size="sm">小按钮</Button>
            <Button variant="secondary" size="md">中按钮</Button>
            <Button variant="outline" size="lg">大按钮</Button>
            <Button loading>加载中...</Button>
          </motion.div>
        </motion.section>

        {/* 卡片展示 */}
        <motion.section
          className="design-demo__section"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.h2 className="design-demo__section-title" variants={staggerItem}>
            卡片组件
          </motion.h2>
          
          <motion.div className="design-demo__cards" variants={staggerItem}>
            <Card hover shadow="lg">
              <CardHeader>
                <h3>默认卡片</h3>
              </CardHeader>
              <CardBody>
                <p>这是一个默认样式的卡片，带有悬停效果。</p>
              </CardBody>
            </Card>

            <Card variant="glass" hover shadow="xl">
              <CardHeader>
                <h3>玻璃态卡片</h3>
              </CardHeader>
              <CardBody>
                <p>这是一个玻璃态卡片，带有模糊背景。</p>
              </CardBody>
            </Card>

            <Card hover shadow="lg">
              <CardHeader>
                <h3>卡片示例</h3>
              </CardHeader>
              <CardBody>
                <p>简洁的卡片设计，复古色调。</p>
              </CardBody>
            </Card>
          </motion.div>
        </motion.section>

        {/* 图标徽章展示 */}
        <motion.section
          className="design-demo__section"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.h2 className="design-demo__section-title" variants={staggerItem}>
            图标徽章
          </motion.h2>
          
          <motion.div className="design-demo__badges" variants={staggerItem}>
            <div className="design-demo__badge-group">
              <IconBadge icon="💕" color="pink" variant="soft" size="lg" />
              <span>粉色</span>
            </div>
            <div className="design-demo__badge-group">
              <IconBadge icon="⭐" color="yellow" variant="soft" size="lg" />
              <span>黄色</span>
            </div>
            <div className="design-demo__badge-group">
              <IconBadge icon="💙" color="blue" variant="soft" size="lg" />
              <span>蓝色</span>
            </div>
            <div className="design-demo__badge-group">
              <IconBadge icon="🌿" color="green" variant="soft" size="lg" />
              <span>绿色</span>
            </div>
            <div className="design-demo__badge-group">
              <IconBadge icon="💜" color="purple" variant="soft" size="lg" />
              <span>紫色</span>
            </div>
            <div className="design-demo__badge-group">
              <IconBadge icon="☕" color="brown" variant="soft" size="lg" />
              <span>咖啡棕</span>
            </div>
          </motion.div>

          <motion.div className="design-demo__badges" variants={staggerItem}>
            <IconBadge icon="💕" color="pink" variant="solid" size="md" />
            <IconBadge icon="⭐" color="yellow" variant="solid" size="md" />
            <IconBadge icon="💙" color="blue" variant="solid" size="md" />
            <IconBadge icon="🌿" color="green" variant="solid" size="md" />
            <IconBadge icon="💜" color="purple" variant="solid" size="md" />
            <IconBadge icon="☕" color="brown" variant="solid" size="md" />
          </motion.div>

          <motion.div className="design-demo__badges" variants={staggerItem}>
            <IconBadge icon="💕" color="pink" variant="outline" size="md" />
            <IconBadge icon="⭐" color="yellow" variant="outline" size="md" />
            <IconBadge icon="💙" color="blue" variant="outline" size="md" />
            <IconBadge icon="🌿" color="green" variant="outline" size="md" />
            <IconBadge icon="💜" color="purple" variant="outline" size="md" />
            <IconBadge icon="☕" color="brown" variant="outline" size="md" />
          </motion.div>
        </motion.section>

        {/* 标签展示 */}
        <motion.section
          className="design-demo__section"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.h2 className="design-demo__section-title" variants={staggerItem}>
            标签组件
          </motion.h2>
          
          <motion.div className="design-demo__tags" variants={staggerItem}>
            <Badge color="pink" variant="soft">粉色标签</Badge>
            <Badge color="yellow" variant="soft">黄色标签</Badge>
            <Badge color="blue" variant="soft">蓝色标签</Badge>
            <Badge color="green" variant="soft">绿色标签</Badge>
            <Badge color="purple" variant="soft">紫色标签</Badge>
            <Badge color="brown" variant="soft">咖啡棕标签</Badge>
          </motion.div>

          <motion.div className="design-demo__tags" variants={staggerItem}>
            <Badge color="pink" variant="solid">粉色</Badge>
            <Badge color="yellow" variant="solid">黄色</Badge>
            <Badge color="blue" variant="solid">蓝色</Badge>
            <Badge color="green" variant="solid">绿色</Badge>
            <Badge color="purple" variant="solid">紫色</Badge>
            <Badge color="brown" variant="solid">咖啡棕</Badge>
          </motion.div>

          <motion.div className="design-demo__tags" variants={staggerItem}>
            <Badge color="pink" variant="outline">粉色</Badge>
            <Badge color="yellow" variant="outline">黄色</Badge>
            <Badge color="blue" variant="outline">蓝色</Badge>
            <Badge color="green" variant="outline">绿色</Badge>
            <Badge color="purple" variant="outline">紫色</Badge>
            <Badge color="brown" variant="outline">咖啡棕</Badge>
          </motion.div>
        </motion.section>

        {/* 色彩展示 */}
        <motion.section
          className="design-demo__section"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.h2 className="design-demo__section-title" variants={staggerItem}>
            色彩系统 - 低饱和复古色
          </motion.h2>
          
          <motion.div className="design-demo__colors" variants={staggerItem}>
            <div className="color-swatch" style={{ background: 'var(--color-pink-500)' }}>
              <span>粉色</span>
            </div>
            <div className="color-swatch" style={{ background: 'var(--color-yellow-500)' }}>
              <span>鸡蛋黄</span>
            </div>
            <div className="color-swatch" style={{ background: 'var(--color-blue-500)' }}>
              <span>蓝色</span>
            </div>
            <div className="color-swatch" style={{ background: 'var(--color-green-500)' }}>
              <span>绿色</span>
            </div>
            <div className="color-swatch" style={{ background: 'var(--color-purple-500)' }}>
              <span>紫色</span>
            </div>
            <div className="color-swatch" style={{ background: 'var(--color-brown-500)' }}>
              <span>咖啡棕</span>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
};

export default DesignSystemDemo;

