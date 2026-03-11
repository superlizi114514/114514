<template>
  <div class="admin-home-page">
    <div class="page-header">
      <h1>管理后台</h1>
      <p>系统管理与审核</p>
    </div>

    <!-- 管理员验证 -->
    <div class="auth-card" v-if="!isAuthenticated">
      <van-icon name="lock" class="auth-icon" />
      <h2>管理员验证</h2>
      <p class="auth-tip">仅限管理员用户访问</p>
      <van-button type="primary" block round @click="goToLogin">
        前往登录
      </van-button>
    </div>

    <template v-else>
      <!-- 管理功能卡片 -->
      <div class="admin-grid">
        <!-- 举报处理 -->
        <div class="admin-card" @click="$router.push('/admin/reports')">
          <div class="admin-icon" style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); color: #DC2626;">
            <van-icon name="warning-o" />
          </div>
          <div class="admin-content">
            <h3>举报处理</h3>
            <p>审核用户举报</p>
          </div>
          <van-icon name="arrow" class="admin-arrow" />
        </div>

        <!-- 邀请码管理 -->
        <div class="admin-card" @click="showInviteManage = true">
          <div class="admin-icon" style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); color: #2563EB;">
            <van-icon name="gift-o" />
          </div>
          <div class="admin-content">
            <h3>邀请码管理</h3>
            <p>生成和查看邀请码</p>
          </div>
          <van-icon name="arrow" class="admin-arrow" />
        </div>

        <!-- 违禁词管理 -->
        <div class="admin-card" @click="showBlockedWords = true">
          <div class="admin-icon" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); color: #D97706;">
            <van-icon name="forbid-o" />
          </div>
          <div class="admin-content">
            <h3>违禁词管理</h3>
            <p>管理不当词汇</p>
          </div>
          <van-icon name="arrow" class="admin-arrow" />
        </div>

        <!-- 用户管理 -->
        <div class="admin-card" @click="loadUserList">
          <div class="admin-icon" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); color: #059669;">
            <van-icon name="users-o" />
          </div>
          <div class="admin-content">
            <h3>用户管理</h3>
            <p>查看和管理用户</p>
          </div>
          <van-icon name="arrow" class="admin-arrow" />
        </div>

        <!-- 人员管理 -->
        <div class="admin-card" @click="loadProfileList">
          <div class="admin-icon" style="background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%); color: #DB2777;">
            <van-icon name="manager-o" />
          </div>
          <div class="admin-content">
            <h3>人员管理</h3>
            <p>管理人员榜单</p>
          </div>
          <van-icon name="arrow" class="admin-arrow" />
        </div>

        <!-- 商家管理 -->
        <div class="admin-card" @click="loadMerchantList">
          <div class="admin-icon" style="background: linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%); color: #E11D48;">
            <van-icon name="shop-o" />
          </div>
          <div class="admin-content">
            <h3>商家管理</h3>
            <p>管理商家榜单</p>
          </div>
          <van-icon name="arrow" class="admin-arrow" />
        </div>

        <!-- 赞助管理 -->
        <div class="admin-card" @click="$router.push('/admin/support')">
          <div class="admin-icon" style="background: linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%); color: #EA580C;">
            <van-icon name="gift" />
          </div>
          <div class="admin-content">
            <h3>赞助管理</h3>
            <p>管理赞助记录和金额</p>
          </div>
          <van-icon name="arrow" class="admin-arrow" />
        </div>

        <!-- 兼职管理 -->
        <div class="admin-card" @click="$router.push('/admin/part-time-jobs')">
          <div class="admin-icon" style="background: linear-gradient(135deg, #ECFCCB 0%, #D9F99D 100%); color: #65A30D;">
            <van-icon name="bag-o" />
          </div>
          <div class="admin-content">
            <h3>兼职管理</h3>
            <p>管理兼职信息发布时间</p>
          </div>
          <van-icon name="arrow" class="admin-arrow" />
        </div>
      </div>

      <!-- 退出按钮 -->
      <van-button class="logout-btn" plain block round @click="handleLogout">
        退出管理后台
      </van-button>
    </template>

    <!-- 邀请码管理弹窗 -->
    <van-popup v-model:show="showInviteManage" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <h2>邀请码管理</h2>
          <van-icon name="cross" @click="showInviteManage = false" />
        </div>
        <van-button type="primary" block round @click="generateInviteCode" :loading="generating">
          {{ generating ? '生成中...' : '生成新邀请码' }}
        </van-button>
        <div v-if="generatedCode" class="generated-code">
          <van-icon name="success" style="color: #10b981;" />
          <span>新邀请码：{{ generatedCode }}</span>
        </div>
        <div v-if="inviteList.length > 0" class="invite-list">
          <h3>邀请码列表（最近 20 个）</h3>
          <div v-for="item in recentInviteList" :key="item.id" class="invite-item">
            <span class="code">{{ item.code }}</span>
            <van-tag :type="item.usedBy ? 'success' : 'primary'">
              {{ item.usedBy ? '已使用' : '未使用' }}
            </van-tag>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 违禁词管理弹窗 -->
    <van-popup v-model:show="showBlockedWords" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <h2>违禁词管理</h2>
          <van-icon name="cross" @click="showBlockedWords = false" />
        </div>
        <van-form @submit="addBlockedWord">
          <van-field
            v-model="newBlockedWord"
            label="新违禁词"
            placeholder="输入要添加的违禁词"
            clearable
          />
          <van-button type="primary" block round native-type="submit" :loading="addingWord">
            添加
          </van-button>
        </van-form>
        <div v-if="blockedWords.length > 0" class="word-list">
          <h3>违禁词列表（{{ blockedWords.length }} 个）</h3>
          <div v-for="item in blockedWords" :key="item.word" class="word-item">
            <div class="word-info">
              <span>{{ item.word }}</span>
              <van-tag type="danger" size="small">{{ item.category }}</van-tag>
              <van-tag :type="item.isActive ? 'success' : 'default'" size="small">{{ item.isActive ? '启用中' : '已禁用' }}</van-tag>
            </div>
            <div class="word-actions">
              <van-button size="mini" type="danger" plain @click="deleteBlockedWord(item.word)" v-if="item.isActive">禁用</van-button>
              <van-button size="mini" type="primary" plain @click="restoreBlockedWord(item.word)" v-else>恢复</van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 用户列表弹窗 -->
    <van-popup v-model:show="showUserList" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <h2>用户管理</h2>
          <van-icon name="cross" @click="showUserList = false" />
        </div>
        <div v-if="userList.length > 0" class="user-list">
          <div v-for="user in userList" :key="user.id" class="user-item">
            <div class="user-info">
              <span class="email">{{ user.email }}</span>
              <span class="nickname" v-if="user.nickname">({{ user.nickname }})</span>
              <span class="title" v-if="user.title && user.showTitle === 1">🏷️ {{ user.title }}</span>
              <div class="tags">
                <van-tag v-if="user.isSvip" type="primary" size="small">SVIP</van-tag>
                <van-tag v-else-if="user.isMvip" type="success" size="small">MVIP</van-tag>
                <van-tag v-else-if="user.isVip" type="warning" size="small">VIP</van-tag>
                <van-tag v-else-if="isAdminEmail(user.email)" type="danger" size="small">管理员</van-tag>
              </div>
              <div class="user-meta">
                <span class="uid">UID: {{ user.id }}</span>
                <span class="expire" v-if="user.vipExpire">VIP 至：{{ formatDate(user.vipExpire) }}</span>
                <span class="expire" v-if="user.svipExpire">SVIP 至：{{ formatDate(user.svipExpire) }}</span>
              </div>
            </div>
            <div class="user-actions-popup">
              <van-button size="mini" type="primary" plain @click="openTitleSetting(user)">设置称号</van-button>
              <van-button size="mini" type="primary" plain @click="viewUserDetail(user)">详情</van-button>
              <van-button size="mini" type="success" plain @click="showGrantSupport(user)" v-if="!isAdminEmail(user.email)">赞助</van-button>
              <van-button size="mini" type="warning" plain @click="showSetVip(user)" v-if="!isAdminEmail(user.email)">设置 VIP</van-button>
              <van-button size="mini" type="danger" plain @click="confirmDeleteUser(user)" v-if="!isAdminEmail(user.email)">删除</van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 用户详情弹窗 -->
    <van-popup v-model:show="showUserDetailPopup" position="center" round>
      <div class="popup-content" style="width: 90%; max-width: 400px; padding: 24px;">
        <div class="popup-header">
          <h2>用户详情</h2>
          <van-icon name="cross" @click="showUserDetailPopup = false" />
        </div>
        <div v-if="currentUser" class="user-detail">
          <div class="detail-row">
            <span class="detail-label">用户 ID</span>
            <span class="detail-value">{{ currentUser.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">邮箱</span>
            <span class="detail-value">{{ currentUser.email }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">昵称</span>
            <span class="detail-value">{{ currentUser.nickname || '未设置' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">VIP 状态</span>
            <span class="detail-value">
              <van-tag v-if="currentUser.isSvip" type="primary">SVIP</van-tag>
              <van-tag v-else-if="currentUser.isMvip" type="success">MVIP</van-tag>
              <van-tag v-else-if="currentUser.isVip" type="warning">VIP</van-tag>
              <span v-else>普通用户</span>
            </span>
          </div>
          <div class="detail-row" v-if="currentUser.vipExpire">
            <span class="detail-label">VIP 过期</span>
            <span class="detail-value">{{ formatDate(currentUser.vipExpire) }}</span>
          </div>
          <div class="detail-row" v-if="currentUser.svipExpire">
            <span class="detail-label">SVIP 过期</span>
            <span class="detail-value">{{ formatDate(currentUser.svipExpire) }}</span>
          </div>
          <div class="detail-row" v-if="currentUser.mvipExpire">
            <span class="detail-label">MVIP 过期</span>
            <span class="detail-value">{{ formatDate(currentUser.mvipExpire) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">注册时间</span>
            <span class="detail-value">{{ formatDate(currentUser.createdAt) }}</span>
          </div>
          <div class="detail-actions">
            <van-button plain block type="primary" @click="resetUserReviews(currentUser)" v-if="!isAdminEmail(currentUser.email)">刷新点评次数</van-button>
            <van-button plain block type="warning" @click="resetUserPassword(currentUser)" v-if="!isAdminEmail(currentUser.email)">重置密码</van-button>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 称号设置弹窗 -->
    <van-popup v-model:show="showTitleSettingPopup" position="center" round>
      <div class="popup-content" style="width: 90%; max-width: 400px; padding: 24px;">
        <div class="popup-header">
          <h2>设置用户称号</h2>
          <van-icon name="cross" @click="showTitleSettingPopup = false" />
        </div>
        <div v-if="currentUser" class="title-setting-form">
          <p class="user-email-display">{{ currentUser.email }}</p>

          <!-- 称号输入框 -->
          <van-field
            v-model="titleInput"
            placeholder="输入自定义称号"
            clearable
            label="称号"
          />

          <!-- 显示开关 -->
          <div class="title-toggle-row">
            <span class="toggle-label">显示称号</span>
            <van-switch
              v-model="titleShowEnabled"
              size="20px"
              active-color="#10b981"
              inactive-color="#d1d5db"
            />
          </div>

          <!-- 可选称号列表 -->
          <div v-if="userAvailableTitles.length > 0" class="user-title-selector">
            <div class="selector-label">可选称号（点击选择）</div>
            <van-cell-group inset>
              <van-cell
                v-for="title in displayedUserTitles"
                :key="title"
                :title="title"
                clickable
                @click="titleInput = title"
              >
                <template #right-icon>
                  <van-icon v-if="title === titleInput" name="checked" color="#1989fa" />
                </template>
              </van-cell>
            </van-cell-group>
            <div v-if="userAvailableTitles.length > 3" class="expand-toggle" @click="toggleUserTitleExpand">
              <span>{{ isUserTitleExpanded ? '收起' : '展开全部' }}</span>
              <van-icon :name="isUserTitleExpanded ? 'up' : 'down'" />
            </div>
          </div>

          <!-- 保存按钮 -->
          <van-button type="primary" block round @click="updateUserTitle(currentUser)" style="margin-top: 16px;">
            保存称号
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 设置 VIP 弹窗 -->
    <van-popup v-model:show="showSetVipPopup" position="center" round>
      <div class="popup-content" style="width: 300px; padding: 24px;">
        <div class="popup-header">
          <h2>设置 VIP 权限</h2>
          <van-icon name="cross" @click="showSetVipPopup = false" />
        </div>
        <div v-if="currentUser" class="set-vip-form">
          <p class="user-email-display">{{ currentUser.email }}</p>
          <van-field
            v-model="vipDays"
            type="number"
            label="天数"
            placeholder="填 0 或留空表示取消"
            clearable
          />
          <van-cell-group inset>
            <van-radio-group v-model="vipType" direction="vertical">
              <van-radio name="vip">VIP (¥15/月，每日 5 次)</van-radio>
              <van-radio name="mvip">MVIP (¥6/周，每日 8 次)</van-radio>
              <van-radio name="svip">SVIP (¥30/季，每日 10 次)</van-radio>
            </van-radio-group>
          </van-cell-group>
          <van-button type="primary" block round @click="submitSetVip" :loading="settingVip">
            确认设置
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 管理员赞助开通弹窗 -->
    <van-popup v-model:show="showGrantSupportPopup" position="center" round>
      <div class="popup-content" style="width: 300px; padding: 24px;">
        <div class="popup-header">
          <h2>开通赞助</h2>
          <van-icon name="cross" @click="showGrantSupportPopup = false" />
        </div>
        <div v-if="currentUser" class="grant-support-form">
          <p class="user-email-display">{{ currentUser.email }}</p>
          <van-field
            v-model="supportAmount"
            type="number"
            label="赞助金额"
            placeholder="输入金额（¥）"
            clearable
          >
            <template #prefix>¥</template>
          </van-field>
          <van-field
            v-model="supportDays"
            type="number"
            label="开通天数"
            placeholder="输入开通天数"
            clearable
          />
          <div class="support-level-tip">
            <van-tag :type="supportLevel === 'SVIP' ? 'primary' : 'warning'">{{ supportLevel }}</van-tag>
            <span class="tip-text" v-if="supportAmount >= 30">（满¥30 自动开通 SVIP）</span>
            <span class="tip-text" v-else-if="supportAmount >= 15">（满¥15 开通 VIP）</span>
          </div>
          <van-button type="success" block round @click="submitGrantSupport" :loading="grantingSupport">
            确认开通
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 人员管理弹窗 -->
    <van-popup v-model:show="showProfileListPopup" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <h2>人员管理</h2>
          <div class="header-actions">
            <van-button size="small" type="success" plain @click="exportProfiles">导出数据</van-button>
            <van-icon name="cross" @click="showProfileListPopup = false" />
          </div>
        </div>
        <!-- 搜索栏 -->
        <div class="search-bar">
          <van-field
            v-model="profileSearchKeyword"
            placeholder="搜索姓名/校区/班级"
            clearable
            size="small"
            left-icon="search"
            @input="filterProfiles"
          />
          <van-field
            v-model="profileSearchUid"
            placeholder="UID 精确搜索"
            clearable
            size="small"
            type="number"
            @input="filterProfilesByUid"
          />
        </div>
        <!-- 统计信息 -->
        <div class="profile-stats">
          <span>共 {{ profileList.length }} 人</span>
          <span v-if="filteredProfiles.length !== profileList.length"> | 筛选后 {{ filteredProfiles.length }} 人</span>
        </div>
        <!-- 列表 -->
        <div v-if="filteredProfiles.length > 0" class="list-wrapper">
          <div v-for="item in filteredProfiles" :key="item.id" class="list-item">
            <div class="item-info">
              <span class="item-id">ID: {{ item.id }}</span>
              <span class="item-uid">UID: {{ item.userId }}</span>
              <span class="item-name">{{ item.name }}</span>
              <van-tag :type="item.type === 'red' ? 'success' : 'warning'" size="small">{{ item.type === 'red' ? '红榜' : '黑榜' }}</van-tag>
              <span class="item-meta" v-if="item.campus">{{ item.campus }}</span>
              <span class="item-meta" v-if="item.className">{{ item.className }}</span>
              <span class="item-meta">点评数：{{ item._count?.reviews || 0 }}</span>
            </div>
            <div class="item-actions">
              <van-button size="mini" type="primary" plain @click="viewProfileReviews(item)">票数</van-button>
              <van-button size="mini" type="primary" plain @click="editProfile(item)">编辑</van-button>
              <van-button size="mini" type="danger" plain @click="confirmDeleteProfile(item.id)">删除</van-button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <van-empty :description="profileList.length === 0 ? '暂无人员数据' : '无匹配结果'" />
        </div>
      </div>
    </van-popup>

    <!-- 查看人员点评详情（票数管理）弹窗 -->
    <van-popup v-model:show="showProfileReviewsPopup" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <h2>票数管理 - {{ currentProfile?.name }}</h2>
          <van-icon name="cross" @click="showProfileReviewsPopup = false" />
        </div>
        <div v-if="profileReviews.length > 0" class="list-wrapper">
          <div v-for="item in profileReviews" :key="item.id" class="list-item review-item">
            <div class="item-info">
              <div class="review-header">
                <van-tag :type="item.type === 'red' ? 'success' : 'warning'" size="small">{{ item.type === 'red' ? '红榜' : '黑榜' }}</van-tag>
                <span class="review-meta">{{ formatRelativeDate(item.createdAt) }}</span>
              </div>
              <span class="review-content">{{ item.content }}</span>
              <div class="vote-display">
                <span class="vote-label">大票：</span>
                <span class="vote-value big">{{ item.bigVotes }}</span>
                <span class="vote-label">小票：</span>
                <span class="vote-value small">{{ item.smallVotes }}</span>
                <span class="vote-total">权重：{{ (item.bigVotes + item.smallVotes / 10).toFixed(1) }}</span>
              </div>
            </div>
            <div class="item-actions">
              <van-button size="mini" type="primary" plain @click="editVotes(item)">修改</van-button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <van-empty description="暂无点评记录" />
        </div>
      </div>
    </van-popup>

    <!-- 修改票数弹窗 -->
    <van-popup v-model:show="showEditVotesPopup" position="center" round>
      <div class="popup-content" style="width: 90%; max-width: 400px; padding: 24px;">
        <div class="popup-header">
          <h2>修改票数</h2>
          <van-icon name="cross" @click="showEditVotesPopup = false" />
        </div>
        <van-form @submit="submitEditVotes">
          <div class="vote-edit-section">
            <span class="vote-edit-label">大票数：</span>
            <input type="number" v-model="voteForm.bigVotes" min="0" max="1" class="vote-edit-input" />
          </div>
          <div class="vote-edit-section">
            <span class="vote-edit-label">小票数：</span>
            <input type="number" v-model="voteForm.smallVotes" min="0" class="vote-edit-input" />
          </div>
          <div class="vote-edit-total">
            权重分：{{ (Number(voteForm.bigVotes) + Number(voteForm.smallVotes) / 10).toFixed(1) }}
          </div>
          <van-button type="primary" block round native-type="submit" :loading="submitting">
            保存
          </van-button>
        </van-form>
      </div>
    </van-popup>

    <!-- 编辑人员弹窗 -->
    <van-popup v-model:show="showEditProfilePopup" position="center" round>
      <div class="popup-content" style="width: 90%; max-width: 400px; padding: 24px;">
        <div class="popup-header">
          <h2>编辑人员</h2>
          <van-icon name="cross" @click="showEditProfilePopup = false" />
        </div>
        <van-form @submit="submitEditProfile">
          <van-field v-model="editingProfile.name" label="姓名" placeholder="请输入姓名" required />
          <van-field v-model="editingProfile.campus" label="校区" placeholder="请输入校区" />
          <van-field v-model="editingProfile.className" label="班级" placeholder="请输入班级" />
          <van-field v-model="editingProfile.remark" label="备注" placeholder="请输入备注" />
          <van-radio-group v-model="editingProfile.type" direction="horizontal" style="margin: 12px 0;">
            <van-radio name="red">红榜</van-radio>
            <van-radio name="black">黑榜</van-radio>
          </van-radio-group>
          <van-button type="primary" block round native-type="submit" :loading="submitting">
            保存
          </van-button>
        </van-form>
      </div>
    </van-popup>

    <!-- 商家管理弹窗 -->
    <van-popup v-model:show="showMerchantListPopup" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <h2>商家管理</h2>
          <van-icon name="cross" @click="showMerchantListPopup = false" />
        </div>
        <van-button type="primary" block round @click="showAddMerchant = true" style="margin-bottom: 12px;">
          添加商家
        </van-button>
        <div v-if="merchantList.length > 0" class="list-wrapper">
          <div v-for="item in merchantList" :key="item.id" class="list-item">
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-meta" v-if="item.category">分类：{{ item.category }}</span>
              <span class="item-meta">点评数：{{ item._count?.reviews || 0 }}</span>
            </div>
            <div class="item-actions">
              <van-button size="mini" type="primary" plain @click="viewMerchantReviews(item)">票数</van-button>
              <van-button size="mini" type="primary" plain @click="editMerchant(item)">编辑</van-button>
              <van-button size="mini" type="danger" plain @click="confirmDeleteMerchant(item.id)">删除</van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 查看商家点评详情（票数管理）弹窗 -->
    <van-popup v-model:show="showMerchantReviewsPopup" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <h2>票数管理 - {{ currentMerchant?.name }}</h2>
          <van-icon name="cross" @click="showMerchantReviewsPopup = false" />
        </div>
        <div v-if="merchantReviews.length > 0" class="list-wrapper">
          <div v-for="item in merchantReviews" :key="item.id" class="list-item review-item">
            <div class="item-info">
              <div class="review-header">
                <van-tag :type="item.type === 'red' ? 'success' : 'warning'" size="small">{{ item.type === 'red' ? '红榜' : '黑榜' }}</van-tag>
                <span class="review-meta">{{ formatRelativeDate(item.createdAt) }}</span>
              </div>
              <span class="review-content">{{ item.content }}</span>
              <div class="vote-display">
                <span class="vote-label">大票：</span>
                <span class="vote-value big">{{ item.bigVotes }}</span>
                <span class="vote-label">小票：</span>
                <span class="vote-value small">{{ item.smallVotes }}</span>
                <span class="vote-total">权重：{{ (item.bigVotes + item.smallVotes / 10).toFixed(1) }}</span>
              </div>
            </div>
            <div class="item-actions">
              <van-button size="mini" type="primary" plain @click="editVotes(item)">修改</van-button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <van-empty description="暂无点评记录" />
        </div>
      </div>
    </van-popup>

    <!-- 添加/编辑商家弹窗 -->
    <van-popup v-model:show="showAddMerchant" position="center" round>
      <div class="popup-content" style="width: 90%; max-width: 400px; padding: 24px;">
        <div class="popup-header">
          <h2>{{ editingMerchant ? '编辑商家' : '添加商家' }}</h2>
          <van-icon name="cross" @click="showAddMerchant = false" />
        </div>
        <van-form @submit="submitMerchant">
          <van-field v-model="merchantForm.name" label="名称" placeholder="请输入商家名称" required />
          <van-field v-model="merchantForm.category" label="分类" placeholder="请输入分类" />
          <van-field v-model="merchantForm.address" label="地址" placeholder="请输入地址" />
          <van-field v-model="merchantForm.phone" label="电话" placeholder="请输入电话" />
          <van-button type="primary" block round native-type="submit" :loading="submitting">
            保存
          </van-button>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import http from '../api/http'

const router = useRouter()

// Dialog 使用
const confirmDialog = (options: any) => {
  return showDialog({
    title: options.title,
    message: options.message,
    showCancelButton: true,
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  })
}

const isAuthenticated = ref(false)
const showInviteManage = ref(false)
const showBlockedWords = ref(false)
const showUserList = ref(false)
const showUserDetailPopup = ref(false)
const showTitleSettingPopup = ref(false) // 称号设置弹窗
const showSetVipPopup = ref(false)
const showGrantSupportPopup = ref(false)
const generatedCode = ref('')
const generating = ref(false)
const addingWord = ref(false)
const settingVip = ref(false)
const newBlockedWord = ref('')
const vipDays = ref('')
const vipType = ref('vip')
const supportAmount = ref('')
const supportDays = ref('')
const grantingSupport = ref(false)
const inviteList = ref<any[]>([])
const blockedWords = ref<any[]>([])
const userList = ref<any[]>([])
const currentUser = ref<any>(null)
const titleInput = ref('')
const titleShowEnabled = ref(false)
const userAvailableTitles = ref<string[]>([]) // 用户可用的称号列表
const isUserTitleExpanded = ref(false) // 是否展开称号列表

// 人员和商家管理相关
const showProfileListPopup = ref(false)
const showProfileReviewsPopup = ref(false)
const showEditVotesPopup = ref(false)
const showMerchantReviewsPopup = ref(false)
const showMerchantListPopup = ref(false)
const showEditProfilePopup = ref(false)
const showAddMerchant = ref(false)
const profileList = ref<any[]>([])
const filteredProfiles = ref<any[]>([])
const profileSearchKeyword = ref('')
const profileSearchUid = ref('')
const profileReviews = ref<any[]>([])
const merchantReviews = ref<any[]>([])
const currentProfile = ref<any>(null)
const currentMerchant = ref<any>(null)
const currentReview = ref<any>(null)
const merchantList = ref<any[]>([])
const editingProfile = ref<any>(null)
const editingMerchant = ref<any>(null)
const merchantForm = ref({ name: '', category: '', address: '', phone: '' })
const voteForm = ref({ bigVotes: 0, smallVotes: 0 })
const submitting = ref(false)

// 赞助等级计算
const supportLevel = computed(() => {
  const amount = Number(supportAmount.value)
  if (amount >= 30) return 'SVIP'
  if (amount >= 15) return 'VIP'
  return '' // 金额 < 15 元时不开通会员
})

// 检查是否是管理员用户（支持 admin@admin 和 admin@admin.admin）
const isAdminEmail = (email: string) => {
  return email === 'admin@admin' || email === 'admin@admin.admin'
}

const checkAdminUser = async () => {
  try {
    const { data } = await http.get('/api/auth/me')
    if (data.success && data.user) {
      if (isAdminEmail(data.user.email)) {
        isAuthenticated.value = true
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const handleLogout = () => {
  isAuthenticated.value = false
  showToast('已退出')
  router.push('/')
}

const generateInviteCode = async () => {
  generating.value = true
  try {
    const { data } = await http.post('/api/invite-codes/generate')
    if (data.success) {
      generatedCode.value = data.code
      showToast('生成成功')
      loadInviteList()
    } else {
      showToast(data.message || '生成失败')
    }
  } catch {
    showToast('生成失败')
  } finally {
    generating.value = false
  }
}

const loadInviteList = async () => {
  try {
    const { data } = await http.get('/api/invite-codes/list')
    if (data.success) {
      inviteList.value = data.list || []
    }
  } catch {
    // 静默失败
  }
}

const loadBlockedWords = async () => {
  try {
    const { data } = await http.get('/api/blocked-words/all')
    if (data.success) {
      blockedWords.value = data.words || []
    }
  } catch {
    // 静默失败
  }
}

const addBlockedWord = async () => {
  if (!newBlockedWord.value) {
    showToast('请输入违禁词')
    return
  }
  addingWord.value = true
  try {
    const { data } = await http.post('/api/blocked-words', {
      word: newBlockedWord.value,
      category: 'insult'
    })
    if (data.success) {
      showToast('添加成功')
      newBlockedWord.value = ''
      loadBlockedWords()
    } else {
      showToast(data.message || '添加失败')
    }
  } catch {
    showToast('添加失败')
  } finally {
    addingWord.value = false
  }
}

const deleteBlockedWord = async (word: string) => {
  try {
    const { data } = await http.delete(`/api/blocked-words/${encodeURIComponent(word)}`)
    if (data.success) {
      showToast('已禁用')
      loadBlockedWords()
    } else {
      showToast(data.message || '禁用失败')
    }
  } catch {
    showToast('禁用失败')
  }
}

const restoreBlockedWord = async (word: string) => {
  try {
    const { data } = await http.post(`/api/blocked-words/${encodeURIComponent(word)}/restore`)
    if (data.success) {
      showToast('已恢复')
      loadBlockedWords()
    } else {
      showToast(data.message || '恢复失败')
    }
  } catch {
    showToast('恢复失败')
  }
}

const loadUserList = async () => {
  try {
    const { data } = await http.get('/api/admin/users')
    if (data.success) {
      userList.value = data.data || []
      showUserList.value = true
    } else {
      showToast(data.message || '加载失败')
    }
  } catch (e: any) {
    console.error('加载用户列表失败:', e)
    showToast(e.response?.data?.message || '加载失败，请检查权限')
  }
}

const viewUserDetail = (user: any) => {
  currentUser.value = user
  showUserDetailPopup.value = true
}

// 打开称号设置弹窗
const openTitleSetting = (user: any) => {
  currentUser.value = user
  titleInput.value = user.title || ''
  titleShowEnabled.value = user.showTitle === 1
  isUserTitleExpanded.value = false
  loadUserAvailableTitles(user.id)
  showTitleSettingPopup.value = true
}

// 加载用户可用称号列表
const loadUserAvailableTitles = async (userId: number) => {
  try {
    const { data } = await http.get(`/api/admin/users/${userId}/available-titles`)
    if (data.success) {
      userAvailableTitles.value = data.titles || []
    }
  } catch (e) {
    console.error('加载用户可用称号失败', e)
  }
}

// 用户可用称号的显示列表（默认只显示前 3 个）
const displayedUserTitles = computed(() => {
  if (isUserTitleExpanded.value) {
    return userAvailableTitles.value
  }
  return userAvailableTitles.value.slice(0, 3)
})

// 邀请码列表（只显示最近 20 个）
const recentInviteList = computed(() => {
  return inviteList.value.slice(0, 20)
})

const toggleUserTitleExpand = () => {
  isUserTitleExpanded.value = !isUserTitleExpanded.value
}

const updateUserTitle = async (user: any) => {
  try {
    const { data } = await http.post(`/api/admin/users/${user.id}/set-title`, {
      title: titleInput.value
    })
    if (data.success) {
      showToast('称号已更新')
      user.title = titleInput.value
    } else {
      showToast(data.message || '更新失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '更新失败')
  }
}

const toggleUserTitle = async (user: any) => {
  try {
    const { data } = await http.post(`/api/admin/users/${user.id}/toggle-title`, {
      showTitle: titleShowEnabled.value ? 1 : 0
    })
    if (data.success) {
      showToast('称号显示状态已更新')
      user.showTitle = titleShowEnabled.value ? 1 : 0
    } else {
      showToast(data.message || '更新失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '更新失败')
  }
}

const resetUserPassword = async (user: any) => {
  // 简单重置为默认密码
  const newPwd = '123456'
  try {
    const { data } = await http.post(`/api/admin/users/${user.id}/reset-password`, {
      newPassword: newPwd
    })
    if (data.success) {
      showToast(`密码已重置为：${newPwd}`)
    } else {
      showToast(data.message || '重置失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '重置失败')
  }
}

const resetUserReviews = async (user: any) => {
  try {
    const { data } = await http.post(`/api/admin/users/${user.id}/reset-reviews`)
    if (data.success) {
      showToast('已刷新该用户今日点评次数')
    } else {
      showToast(data.message || '刷新失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '刷新失败')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const confirmDeleteUser = (user: any) => {
  confirmDialog({
    title: '确认删除',
    message: `确定要删除用户 ${user.email} 吗？此操作不可逆，将同时删除该用户的点评和人员数据。`,
  }).then(() => {
    deleteUser(user.id)
  })
}

const deleteUser = async (userId: number) => {
  try {
    const { data } = await http.post(`/api/admin/users/${userId}/delete`)
    if (data.success) {
      showToast('用户已删除')
      loadUserList()
    } else {
      showToast(data.message || '删除失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '删除失败')
  }
}

const showSetVip = (user: any) => {
  currentUser.value = user
  vipDays.value = ''
  vipType.value = 'vip'
  showSetVipPopup.value = true
}

const submitSetVip = async () => {
  if (!currentUser.value) return

  settingVip.value = true
  try {
    // 天数为 0 或空表示取消 VIP
    const days = Number(vipDays.value) || 0

    const { data } = await http.post(`/api/admin/users/${currentUser.value.id}/set-vip`, {
      isSvip: vipType.value === 'svip' && days > 0,
      isMvip: vipType.value === 'mvip' && days > 0,
      isVip: vipType.value === 'vip' && days > 0,
      svipDays: vipType.value === 'svip' ? days : 0,
      mvipDays: vipType.value === 'mvip' ? days : 0,
      vipDays: vipType.value === 'vip' ? days : 0
    })
    if (data.success) {
      showToast(days > 0 ? '设置成功' : '已取消 VIP 权限')
      showSetVipPopup.value = false
      loadUserList()
    } else {
      showToast(data.message || '设置失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '设置失败')
  } finally {
    settingVip.value = false
  }
}

// 赞助开通功能
const showGrantSupport = (user: any) => {
  currentUser.value = user
  supportAmount.value = ''
  supportDays.value = ''
  showGrantSupportPopup.value = true
}

const submitGrantSupport = async () => {
  if (!currentUser.value) return
  if (!supportAmount.value || Number(supportAmount.value) < 1) {
    showToast('赞助金额至少 ¥1')
    return
  }
  const days = Number(supportDays.value)
  if (!supportDays.value || days <= 0) {
    showToast('请输入有效开通参数')
    return
  }

  grantingSupport.value = true
  try {
    const { data } = await http.post('/api/support/admin/grant', {
      targetUserId: currentUser.value.id,
      amount: Number(supportAmount.value),
      vipDays: days
    })
    if (data.success) {
      showToast(data.message || '开通成功')
      showGrantSupportPopup.value = false
      loadUserList()
    } else {
      showToast(data.message || '开通失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '开通失败')
  } finally {
    grantingSupport.value = false
  }
}

// 人员管理函数
const loadProfileList = async () => {
  try {
    const { data } = await http.get('/api/admin/profiles')
    if (data.success) {
      profileList.value = data.data || []
      filteredProfiles.value = profileList.value
      showProfileListPopup.value = true
    } else {
      showToast(data.message || '加载失败')
    }
  } catch (e: any) {
    console.error('加载人员列表失败:', e)
    showToast(e.response?.data?.message || '加载失败')
  }
}

// 筛选人员 - 按姓名/关键词
const filterProfiles = () => {
  const keyword = profileSearchKeyword.value.toLowerCase().trim()
  const uidKeyword = profileSearchUid.value.trim()

  if (!keyword && !uidKeyword) {
    filteredProfiles.value = profileList.value
    return
  }

  filteredProfiles.value = profileList.value.filter((item: any) => {
    // UID 精确搜索优先
    if (uidKeyword && String(item.userId) === uidKeyword) {
      return true
    }
    // 姓名搜索
    if (keyword && item.name.toLowerCase().includes(keyword)) {
      return true
    }
    // 校区搜索
    if (keyword && item.campus && item.campus.toLowerCase().includes(keyword)) {
      return true
    }
    // 班级搜索
    if (keyword && item.className && item.className.toLowerCase().includes(keyword)) {
      return true
    }
    return false
  })
}

// 仅按 UID 筛选
const filterProfilesByUid = () => {
  const uidKeyword = profileSearchUid.value.trim()

  if (!uidKeyword) {
    filterProfiles()
    return
  }

  filteredProfiles.value = profileList.value.filter((item: any) => {
    return String(item.userId) === uidKeyword
  })
}

const viewProfileReviews = async (item: any) => {
  try {
    const { data } = await http.get(`/api/admin/profiles/${item.id}/reviews`)
    if (data.success) {
      profileReviews.value = data.data || []
      currentProfile.value = item
      showProfileReviewsPopup.value = true
    } else {
      showToast(data.message || '加载失败')
    }
  } catch (e: any) {
    console.error('加载人员点评失败:', e)
    showToast(e.response?.data?.message || '加载失败')
  }
}

const editVotes = (item: any) => {
  currentReview.value = item
  voteForm.value = {
    bigVotes: item.bigVotes,
    smallVotes: item.smallVotes
  }
  showEditVotesPopup.value = true
}

// 辅助函数：判断是否是人员点评
const isProfileReview = (item: any): boolean => {
  return item.profileId !== undefined
}

const submitEditVotes = async () => {
  if (!currentReview.value) return

  submitting.value = true
  try {
    // 判断是人员点评还是商家点评
    const isProfile = currentReview.value.profileId !== undefined
    const endpoint = isProfile
      ? `/api/admin/profiles/reviews/${currentReview.value.id}/votes`
      : `/api/admin/merchants/reviews/${currentReview.value.id}/votes`

    const { data } = await http.post(endpoint, voteForm.value)
    if (data.success) {
      showToast('票数已更新')
      showEditVotesPopup.value = false
      // 刷新当前点评列表
      if (currentProfile.value) {
        viewProfileReviews(currentProfile.value)
      } else if (currentMerchant.value) {
        viewMerchantReviews(currentMerchant.value)
      }
    } else {
      showToast(data.message || '更新失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

const formatRelativeDate = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const exportProfiles = async () => {
  try {
    const { data } = await http.get('/api/admin/profiles/export')
    if (data.success) {
      // 创建 JSON 文件下载
      const jsonStr = JSON.stringify(data.data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `人员榜单导出-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      window.URL.revokeObjectURL(url)
      showToast('导出成功')
    } else {
      showToast(data.message || '导出失败')
    }
  } catch (e: any) {
    console.error('导出人员列表失败:', e)
    showToast(e.response?.data?.message || '导出失败')
  }
}

const editProfile = (item: any) => {
  editingProfile.value = {
    id: item.id,
    name: item.name,
    campus: item.campus || '',
    className: item.className || '',
    remark: item.remark || '',
    type: item.type
  }
  showEditProfilePopup.value = true
}

const submitEditProfile = async () => {
  if (!editingProfile.value) return
  submitting.value = true
  try {
    const { data } = await http.post(`/api/admin/profiles/${editingProfile.value.id}/update`, editingProfile.value)
    if (data.success) {
      showToast('更新成功')
      showEditProfilePopup.value = false
      loadProfileList()
    } else {
      showToast(data.message || '更新失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

const confirmDeleteProfile = (id: number) => {
  confirmDialog({
    title: '确认删除',
    message: '确定要删除该人员吗？同时会删除所有相关点评。',
  }).then(() => {
    deleteProfile(id)
  })
}

const deleteProfile = async (id: number) => {
  try {
    const { data } = await http.post(`/api/admin/profiles/${id}/delete`)
    if (data.success) {
      showToast('已删除')
      loadProfileList()
    } else {
      showToast(data.message || '删除失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '删除失败')
  }
}

// 商家管理函数
const loadMerchantList = async () => {
  try {
    const { data } = await http.get('/api/admin/merchants')
    if (data.success) {
      merchantList.value = data.data || []
      showMerchantListPopup.value = true
    } else {
      showToast(data.message || '加载失败')
    }
  } catch (e: any) {
    console.error('加载商家列表失败:', e)
    showToast(e.response?.data?.message || '加载失败')
  }
}

const viewMerchantReviews = async (item: any) => {
  try {
    const { data } = await http.get(`/api/admin/merchants/${item.id}/reviews`)
    if (data.success) {
      merchantReviews.value = data.data || []
      currentMerchant.value = item
      showMerchantReviewsPopup.value = true
    } else {
      showToast(data.message || '加载失败')
    }
  } catch (e: any) {
    console.error('加载商家点评失败:', e)
    showToast(e.response?.data?.message || '加载失败')
  }
}

const editMerchant = (item: any) => {
  editingMerchant.value = item
  merchantForm.value = {
    name: item.name,
    category: item.category || '',
    address: item.address || '',
    phone: item.phone || ''
  }
  showAddMerchant.value = true
}

const confirmDeleteMerchant = (id: number) => {
  confirmDialog({
    title: '确认删除',
    message: '确定要删除该商家吗？同时会删除所有相关点评。',
  }).then(() => {
    deleteMerchant(id)
  })
}

const deleteMerchant = async (id: number) => {
  try {
    const { data } = await http.post(`/api/admin/merchants/${id}/delete`)
    if (data.success) {
      showToast('已删除')
      loadMerchantList()
    } else {
      showToast(data.message || '删除失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '删除失败')
  }
}

const submitMerchant = async () => {
  if (!merchantForm.value.name) {
    showToast('请输入商家名称')
    return
  }
  submitting.value = true
  try {
    let data
    if (editingMerchant.value) {
      data = await http.post(`/api/admin/merchants/${editingMerchant.value.id}/update`, merchantForm.value)
    } else {
      data = await http.post('/api/admin/merchants', merchantForm.value)
    }
    if (data.data.success) {
      showToast(editingMerchant.value ? '更新成功' : '创建成功')
      showAddMerchant.value = false
      editingMerchant.value = null
      merchantForm.value = { name: '', category: '', address: '', phone: '' }
      loadMerchantList()
    } else {
      showToast(data.data.message || '操作失败')
    }
  } catch (e: any) {
    showToast(e.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await checkAdminUser()
  showInviteManage.value = false
  showBlockedWords.value = false
  showUserList.value = false
})
</script>

<style scoped>
.admin-home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 24px 16px;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #0c4a6e;
  margin: 0 0 8px 0;
}

.page-header p {
  font-size: 14px;
  color: #0284c7;
  margin: 0;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);
}

.auth-icon {
  font-size: 48px;
  color: #0284c7;
  margin-bottom: 16px;
}

.auth-card h2 {
  font-size: 18px;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.auth-card .van-field {
  margin-bottom: 16px;
}

.admin-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);
  transition: all 0.2s;
}

.admin-card:active {
  transform: scale(0.98);
}

.admin-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.admin-content {
  flex: 1;
}

.admin-content h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.admin-content p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.admin-arrow {
  color: #9ca3af;
  font-size: 16px;
}

.logout-btn {
  margin-top: 24px;
}

.popup-content {
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 20px;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.popup-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.popup-header .header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.popup-header .van-icon {
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
}

.token-desc {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
}

.generated-code {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #ecfdf5;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 14px;
  color: #047857;
}

/* 人员管理搜索栏 */
.search-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.profile-stats {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 8px;
  margin-bottom: 12px;
}

.invite-list, .word-list, .user-list, .list-wrapper {
  margin-top: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.list-wrapper .list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.item-id {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.item-uid {
  font-size: 11px;
  color: #9ca3af;
}

.item-meta {
  font-size: 11px;
  color: #9ca3af;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.item-meta {
  font-size: 11px;
  color: #9ca3af;
}

.review-item {
  border: 1px solid #f3f4f6;
  margin-bottom: 8px;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.review-meta {
  font-size: 11px;
  color: #9ca3af;
  margin-left: auto;
}

.review-content {
  font-size: 13px;
  color: #374151;
  margin-bottom: 8px;
  line-height: 1.5;
}

.vote-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vote-label {
  font-size: 11px;
  color: #6b7280;
}

.vote-value {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.vote-value.big {
  color: #dc2626;
  background: #fef2f2;
}

.vote-value.small {
  color: #d97706;
  background: #fffbeb;
}

.vote-total {
  font-size: 11px;
  color: #059669;
  font-weight: 600;
  margin-left: auto;
}

.vote-edit-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 8px;
}

.vote-edit-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.vote-edit-input {
  width: 80px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.vote-edit-input:focus {
  outline: none;
  border-color: #0284c7;
}

.vote-edit-total {
  font-size: 12px;
  color: #059669;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
  padding: 8px;
  background: #ecfdf5;
  border-radius: 6px;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invite-list h3, .word-list h3, .user-list h3 {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 12px 0;
}

.invite-item, .word-item, .user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.invite-item .code, .word-item span {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.user-info .email {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.user-info .nickname {
  font-size: 13px;
  color: #6b7280;
  font-weight: 400;
}

.user-info .title {
  font-size: 12px;
  color: #7c3aed;
  font-weight: 600;
  background: #f3e8ff;
  padding: 2px 8px;
  border-radius: 6px;
  align-self: flex-start;
  margin-top: 4px;
}

.user-info .tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.user-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

.user-id {
  font-size: 12px;
  color: #9ca3af;
}

.user-actions-popup {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.set-vip-form {
  padding: 16px 0;
}

.set-vip-form .user-email-display {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  text-align: center;
}

.set-vip-form .van-cell-group {
  margin: 16px 0;
}

.grant-support-form {
  padding: 16px 0;
}

.grant-support-form .user-email-display {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  text-align: center;
}

.support-level-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px 0 16px 0;
}

.tip-text {
  font-size: 12px;
  color: #6b7280;
}

.word-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.word-info span {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.word-actions {
  display: flex;
  gap: 4px;
}

.user-detail {
  padding: 8px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row.full-width {
  display: block;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row.full-width .detail-label {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 13px;
  color: #6b7280;
}

.detail-value {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.detail-actions {
  margin-top: 20px;
}

.title-setting {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.title-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.title-input-row .van-field {
  flex: 1;
}

.title-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.toggle-label {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.user-title-selector {
  width: 100%;
  margin-top: 12px;
}

.selector-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.expand-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 8px;
  font-size: 12px;
  color: #1989fa;
  cursor: pointer;
}

.title-setting-form {
  padding: 8px 0;
}

.title-setting-form .user-email-display {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
}

.title-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  margin-bottom: 12px;
}

.title-toggle-row .toggle-label {
  font-size: 14px;
  color: #6b7280;
}
</style>
