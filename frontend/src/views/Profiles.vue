<template>
  <div class="profiles-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-with-back">
        <van-icon name="arrow-left" class="back-icon" @click="$router.back()" />
        <div class="header-text">
          <h1 class="page-title">人员列表</h1>
          <p class="page-subtitle">添加并点评校园人员</p>
        </div>
      </div>
      <div class="quota-tip" v-if="isLoggedIn">
        <van-icon name="ticket" />
        <span>今日剩余额度：<strong>{{ remaining }}/{{ dailyLimit }}</strong> 次</span>
      </div>
    </div>

    <!-- Add Form Card -->
    <div class="form-card">
      <div class="form-header">
        <van-icon name="plus-circle-o" class="form-icon" />
        <span class="form-title">添加人员</span>
      </div>
      <van-form @submit="createProfile">
        <van-field
          v-model="form.name"
          label="姓名"
          placeholder="请输入姓名（必填）"
          :rules="[{ required: true, message: '请输入姓名' }]"
          clearable
        >
          <template #button>
            <van-button size="small" type="primary" @click="searchExistingProfile">
              查询
            </van-button>
          </template>
        </van-field>
        <!-- 显示已有人员信息 -->
        <div v-if="existingProfiles.length > 0" class="existing-profiles-tip">
          <van-icon name="info-o" class="tip-icon" />
          <span class="tip-text">名为 <strong>{{ form.name }}</strong> 的人员已存在，点击选择：</span>
          <div class="existing-list">
            <div
              v-for="(profile, index) in existingProfiles"
              :key="index"
              class="existing-item"
              @click="selectExistingProfile(index)"
            >
              <div class="existing-info">
                <span class="existing-name">{{ profile.name }}</span>
                <span v-if="profile.campus" class="existing-campus">{{ profile.campus }}</span>
                <span v-if="profile.className" class="existing-class">{{ profile.className }}</span>
                <span class="existing-id">ID: {{ profile.id }}</span>
              </div>
              <van-icon name="checked" class="check-icon" v-if="selectedExistingIndex === index" />
            </div>
          </div>
        </div>
        <van-field
          v-model="form.campus"
          label="校区"
          placeholder="请选择校区（可选）"
          readonly
          @click="showCampusPicker = true"
        />
        <div class="class-input-row">
          <van-field
            v-model="form.grade"
            label="年级"
            placeholder="25"
            type="number"
            maxlength="2"
            required
          />
          <span class="class-label">级</span>
          <van-field
            v-model="form.department"
            label="系"
            placeholder="电子"
            maxlength="4"
            tip="系名必填，前两个字即可"
            required
          />
          <span class="class-label">系</span>
        </div>
        <p class="class-tip">年级和系必填 · 年级填后两个年份即可，系填前两个字即可</p>
        <div class="submit-section">
          <van-button
            class="submit-btn"
            type="primary"
            block
            round
            native-type="submit"
            :loading="submitting"
          >
            {{ submitting ? '创建中...' : '添加人员' }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- Campus Picker -->
    <van-popup v-model:show="showCampusPicker" position="bottom">
      <van-picker
        title="选择校区"
        :columns="campusOptions"
        @confirm="onCampusConfirm"
        @cancel="showCampusPicker = false"
      />
    </van-popup>

    <!-- Review Dialog -->
    <van-dialog
      v-model:show="showReviewDialog"
      title="立即点评"
      :show-confirm-button="false"
      :close-on-click-overlay="false"
    >
      <div class="review-dialog-content">
        <p class="review-hint">已成功添加 <strong>{{ newlyCreatedProfile?.name }}</strong> 到人员库</p>
        <p class="review-hint-sub">现在可以对他/她进行点评（也可跳过）</p>

        <div class="review-form">
          <div class="review-type-selector">
            <span class="type-label">点评类型：</span>
            <div class="type-options">
              <div
                :class="['type-option', 'red', reviewForm.type === 'red' ? 'active' : '']"
                @click="reviewForm.type = 'red'"
              >
                <van-icon name="star" /> 红榜
              </div>
              <div
                :class="['type-option', 'black', reviewForm.type === 'black' ? 'active' : '']"
                @click="reviewForm.type = 'black'"
              >
                <van-icon name="warning-o" /> 黑榜
              </div>
            </div>
          </div>
          <van-field
            v-model="reviewForm.content"
            rows="3"
            type="textarea"
            placeholder="请输入点评内容（必填）"
          />
          <div class="review-count-selector">
            <span class="count-label">点评次数：</span>
            <div class="count-buttons">
              <van-button
                v-for="n in 5"
                :key="n"
                size="small"
                :type="reviewForm.count === n ? 'primary' : 'default'"
                :disabled="!canSelectCount(n)"
                @click="reviewForm.count = n"
              >
                {{ n }}次
              </van-button>
              <van-button
                size="small"
                :type="reviewForm.count === 10 ? 'primary' : 'default'"
                :disabled="!canSelectCount(10)"
                @click="reviewForm.count = 10"
              >
                10 次
              </van-button>
            </div>
            <div v-if="remaining === 0" class="no-quota-tip">
              <van-icon name="warning-o" />
              <span>今日票数已用完，请明日再来</span>
            </div>
          </div>
          <div class="review-actions">
            <van-button plain type="default" block round @click="skipReview">跳过</van-button>
            <van-button type="primary" block round @click="submitReview" :loading="reviewSubmitting">
              {{ reviewSubmitting ? '提交中...' : `提交点评 (${reviewForm.count}次)` }}
            </van-button>
          </div>
        </div>
      </div>
    </van-dialog>

    <!-- List Section -->
    <div class="list-section">
      <div v-if="loading" class="loading-state">
        <van-loading color="#E11D48">加载中...</van-loading>
      </div>
      <div v-else>
        <div class="list-header">
          <van-icon name="friends-o" class="list-icon" />
          <span class="list-title">人员列表</span>
          <span class="list-count" v-if="list.length > 0">{{ list.length }} 人</span>
        </div>

        <div v-if="list.length === 0" class="empty-state">
          <van-empty description="暂无人员，点击上方表单添加" />
        </div>

        <div v-else class="list">
          <div
            v-for="item in list"
            :key="item.name"
            class="profile-card"
            @click="openProfile(item.name)"
          >
            <div class="profile-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="profile-content">
              <div class="profile-name">{{ item.name }}</div>
              <div class="profile-meta">
                <span v-if="item.campusDisplay || item.allCampuses?.length > 0" class="meta-item">
                  <van-icon name="location-o" />
                  {{ item.campusDisplay || item.allCampuses?.join('/') }}
                </span>
                <span v-if="item.classNameDisplay || item.allClassNames?.length > 0" class="meta-item">
                  <van-icon name="cluster-o" />
                  {{ item.classNameDisplay || item.allClassNames?.join('/') }}
                </span>
                <span v-if="!item.campusDisplay && !item.classNameDisplay && (!item.allCampuses || item.allCampuses.length === 0) && (!item.allClassNames || item.allClassNames.length === 0)" class="meta-placeholder">
                  暂无详细信息
                </span>
              </div>
            </div>
            <div class="profile-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Campus Picker -->
    <van-popup v-model:show="showCampusPicker" position="bottom">
      <van-picker
        title="选择校区"
        :columns="campusOptions"
        @confirm="onCampusConfirm"
        @cancel="showCampusPicker = false"
      />
    </van-popup>

    <!-- Review Dialog -->

/* Profile Card */
.list .profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  background: #fafafa;
  border-radius: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-card:last-child {
  margin-bottom: 0;
}

.profile-card:active {
  background: #f3f4f6;
  transform: scale(0.99);
}

.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-avatar svg {
  width: 26px;
  height: 26px;
  color: #DB2777;
}

.profile-content {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #6B7280;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.meta-placeholder {
  color: #9CA3AF;
}

.profile-arrow {
  width: 20px;
  height: 20px;
  color: #9CA3AF;
  flex-shrink: 0;
}

.profile-arrow svg {
  width: 100%;
  height: 100%;
}

/* Review Dialog */
.review-dialog-content {
  padding: 16px;
  text-align: left;
}

.review-hint {
  font-size: 15px;
  color: #374151;
  margin: 0 0 4px 0;
  line-height: 1.5;
}

.review-hint strong {
  color: #E11D48;
  font-weight: 600;
}

.review-hint-sub {
  font-size: 13px;
  color: #6B7280;
  margin: 0 0 16px 0;
}

.review-form {
  margin-top: 16px;
}

.review-type-selector {
  margin-bottom: 12px;
}

.type-options {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.type-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
}

.type-option:active {
  transform: scale(0.98);
}

.type-option.red {
  border-color: #fda4af;
}

.type-option.red.active {
  background: linear-gradient(135deg, #fda4af 0%, #e11d48 100%);
  color: white;
  border-color: #e11d48;
}

.type-option.black {
  border-color: #fcd34d;
}

.type-option.black.active {
  background: linear-gradient(135deg, #fcd34d 0%, #d97706 100%);
  color: white;
  border-color: #d97706;
}

.type-option .van-icon {
  font-size: 16px;
}

.review-count-selector {
  margin-top: 12px;
  margin-bottom: 12px;
}

.count-label {
  font-size: 14px;
  color: #6B7280;
  display: block;
  margin-bottom: 8px;
}

.count-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.count-buttons .van-button {
  min-width: 50px;
  height: 32px;
  font-size: 13px;
  padding: 0 12px;
}

.count-buttons .van-button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.no-quota-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
  padding: 10px;
  background: #FEF2F2;
  border-radius: 8px;
  font-size: 13px;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.no-quota-tip .van-icon {
  font-size: 16px;
}

.review-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.review-actions .van-button {
  flex: 1;
  height: 40px;
  font-weight: 600;
}

.review-actions .van-button--primary {
  background: linear-gradient(135deg, #FB7185 0%, #E11D48 100%);
  border: none;
}
</style>
