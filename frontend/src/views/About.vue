<template>
  <div class="about-page">
    <div class="header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1>关于作者</h1>
          <p>了解山信黑红榜背后的故事</p>
        </div>
      </div>
    </div>

    <div class="content-card">
      <h2>👋 你好呀！</h2>
      <p>
        我是 <strong>LiziStudio</strong>，一名热爱编程的学生。
      </p>
      <p>
        创建这个平台的初衷很简单：想要一个真实、匿名的校园点评平台，
        让同学们可以分享真实的体验和感受。
      </p>
    </div>

    <div class="content-card">
      <h2>📬 联系方式</h2>
      <div class="contact-info">
        <p><strong>微信：</strong>SiNianNiQWQ</p>
        <p><strong>邮箱：</strong>3471023785@qq.com</p>
        <p><strong>QQ：</strong>3471023785</p>
        <p><strong>主页：</strong><a href="https://www.lizistudio.xyz/#/" target="_blank" class="home-link">www.lizistudio.xyz</a></p>
      </div>
    </div>

    <div class="content-card">
      <h2>🎯 项目愿景</h2>
      <ul class="vision-list">
        <li>
          <span class="icon">🏫</span>
          <div>
            <strong>服务校园</strong>
            <p>为在校学生提供真实、有价值的参考信息</p>
          </div>
        </li>
        <li>
          <span class="icon">🔒</span>
          <div>
            <strong>保护隐私</strong>
            <p>真正的匿名机制，让点评更自由、更真实</p>
          </div>
        </li>
        <li>
          <span class="icon">💡</span>
          <div>
            <strong>持续创新</strong>
            <p>不断优化功能，提供更好的用户体验</p>
          </div>
        </li>
      </ul>
    </div>

    <div class="content-card">
      <h2>🛠️ 技术栈</h2>
      <div class="tech-tags">
        <van-tag type="primary">Vue 3</van-tag>
        <van-tag type="primary">TypeScript</van-tag>
        <van-tag type="success">Node.js</van-tag>
        <van-tag type="success">Express</van-tag>
        <van-tag type="warning">Prisma</van-tag>
        <van-tag type="danger">SQLite</van-tag>
      </div>
    </div>

    <div class="footer-card">
      <p>感谢你的访问与支持！💖</p>
      <p class="copyright">© 2024 山信黑红榜 - LiziStudio</p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  padding: 24px 16px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header-with-back {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.back-icon {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #1e3a5f;
  cursor: pointer;
  padding: 8px;
  z-index: 10;
}

.header-text {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #1e3a5f;
  margin: 0 0 8px 0;
}

.header p {
  font-size: 14px;
  color: #3b82f6;
  margin: 0;
}

.content-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
}

.content-card h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.content-card p {
  font-size: 14px;
  line-height: 1.8;
  color: #4b5563;
  margin: 8px 0;
}

.content-card strong {
  color: #1e3a5f;
}

.vision-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.vision-list li {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.vision-list li:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.vision-list .icon {
  font-size: 24px;
  flex-shrink: 0;
}

.vision-list div strong {
  display: block;
  font-size: 15px;
  color: #1e3a5f;
  margin-bottom: 4px;
}

.vision-list div p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tags .van-tag {
  font-size: 13px;
  padding: 4px 12px;
}

.contact-info {
  background: #f9fafb;
  padding: 16px;
  border-radius: 12px;
}

.contact-info p {
  margin: 8px 0;
}

.contact-info a {
  color: #3b82f6;
  text-decoration: none;
  word-break: break-all;
}

.contact-info a:hover {
  text-decoration: underline;
}

.footer-card {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  margin-top: 24px;
}

.footer-card p {
  font-size: 15px;
  color: #1e3a5f;
  margin: 8px 0;
}

.copyright {
  font-size: 12px;
  opacity: 0.8;
}
</style>
