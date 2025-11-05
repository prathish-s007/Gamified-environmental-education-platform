// ============ COMMON UTILITIES & STORAGE MANAGEMENT ============

// Initialize localStorage with default data
function initializeStorage() {
  if (!localStorage.getItem('initialized')) {
    localStorage.setItem('users', JSON.stringify([]));
    localStorage.setItem('schoolQuizzes', JSON.stringify(getDefaultSchoolQuizzes()));
    localStorage.setItem('collegeQuizzes', JSON.stringify(getDefaultCollegeQuizzes()));
    localStorage.setItem('userScores', JSON.stringify([]));
    localStorage.setItem('notifications', JSON.stringify({ school: [], college: [] }));
    localStorage.setItem('auditLog', JSON.stringify([]));
    localStorage.setItem('chatHistory', JSON.stringify([]));
    localStorage.setItem('initialized', 'true');
  }
}

// Get current user from localStorage
function getCurrentUser() {
  const email = localStorage.getItem('currentUser');
  if (!email) return null;
  
  const users = JSON.parse(localStorage.getItem('users')) || [];
  return users.find(u => u.email === email);
}

// Check admin session
function checkAdminSession() {
  const adminUser = localStorage.getItem('adminSession');
  if (!adminUser) return null;
  
  const parsed = JSON.parse(adminUser);
  const expiresAt = new Date(parsed.expiresAt);
  
  if (new Date() > expiresAt) {
    localStorage.removeItem('adminSession');
    return null;
  }
  
  return parsed;
}

// Set admin session (30 minutes)
function setAdminSession(adminEmail) {
  const expiresAt = new Date(new Date().getTime() + 30 * 60000);
  localStorage.setItem('adminSession', JSON.stringify({
    email: adminEmail,
    loginTime: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  }));
}

// Add notification
function addNotification(targetAudience, message, type = 'general') {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || { school: [], college: [] };
  
  const notification = {
    id: Date.now(),
    message: message,
    timestamp: new Date().toISOString(),
    read: false,
    type: type
  };
  
  if (targetAudience === 'both') {
    notifications.school.push(notification);
    notifications.college.push(notification);
  } else {
    notifications[targetAudience].push(notification);
  }
  
  // Keep only last 100 notifications per audience
  notifications.school = notifications.school.slice(-100);
  notifications.college = notifications.college.slice(-100);
  
  localStorage.setItem('notifications', JSON.stringify(notifications));
  return notification;
}

// Get notifications
function getNotifications(audience) {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || { school: [], college: [] };
  return notifications[audience] || [];
}

// Mark notification as read
function markNotificationAsRead(audience, notificationId) {
  const notifications = JSON.parse(localStorage.getItem('notifications')) || { school: [], college: [] };
  
  const notification = notifications[audience].find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }
}

// Get unread notification count
function getUnreadCount(audience) {
  const notifications = getNotifications(audience);
  return notifications.filter(n => !n.read).length;
}

// Add audit log entry
function addAuditLog(admin, action, details) {
  const auditLog = JSON.parse(localStorage.getItem('auditLog')) || [];
  
  auditLog.push({
    id: Date.now(),
    admin: admin,
    action: action,
    details: details,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 500 entries
  localStorage.setItem('auditLog', auditLog.slice(-500));
}

// Add user score
function addUserScore(userId, quizId, score, category, questions) {
  const userScores = JSON.parse(localStorage.getItem('userScores')) || [];
  
  userScores.push({
    id: Date.now(),
    userId: userId,
    quizId: quizId,
    score: score,
    category: category,
    totalQuestions: questions,
    timestamp: new Date().toISOString()
  });
  
  // Update user's score in users list
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const userIndex = users.findIndex(u => u.email === userId);
  if (userIndex !== -1) {
    users[userIndex].totalScore = (users[userIndex].totalScore || 0) + score;
    localStorage.setItem('users', JSON.stringify(users));
  }
  
  localStorage.setItem('userScores', JSON.stringify(userScores));
}

// Get user performance
function getUserPerformance(userId) {
  const userScores = JSON.parse(localStorage.getItem('userScores')) || [];
  return userScores.filter(s => s.userId === userId);
}

// Get leaderboard for school
function getSchoolLeaderboard() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  return users
    .filter(u => u.role === 'student' && u.level === 'school')
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    .slice(0, 100);
}

// Get leaderboard for college
function getCollegeLeaderboard() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  return users
    .filter(u => u.role === 'student' && u.level === 'college')
    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    .slice(0, 100);
}

// Get all users (admin only)
function getAllUsers() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  return users.filter(u => u.role === 'student');
}

// Get analytics
function getAnalytics() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const userScores = JSON.parse(localStorage.getItem('userScores')) || [];
  
  const schoolUsers = users.filter(u => u.level === 'school');
  const collegeUsers = users.filter(u => u.level === 'college');
  
  const avgSchoolScore = schoolUsers.length > 0 
    ? schoolUsers.reduce((sum, u) => sum + (u.totalScore || 0), 0) / schoolUsers.length 
    : 0;
  
  const avgCollegeScore = collegeUsers.length > 0
    ? collegeUsers.reduce((sum, u) => sum + (u.totalScore || 0), 0) / collegeUsers.length
    : 0;
  
  return {
    totalUsers: users.length,
    schoolStudents: schoolUsers.length,
    collegeStudents: collegeUsers.length,
    averageSchoolScore: avgSchoolScore.toFixed(2),
    averageCollegeScore: avgCollegeScore.toFixed(2),
    totalScoresRecorded: userScores.length
  };
}

// Default school quizzes
function getDefaultSchoolQuizzes() {
  return [
    {
      id: 1,
      title: "Biodiversity Basics",
      category: "biodiversity",
      difficulty: "easy",
      questions: [
        {
          id: 1,
          question: "What is biodiversity?",
          options: ["Variety of life forms", "Number of species", "Genetic diversity", "All of the above"],
          correctAnswer: 3,
          timeLimit: 30
        },
        {
          id: 2,
          question: "Which of these is NOT a type of biodiversity?",
          options: ["Genetic diversity", "Species diversity", "Color diversity", "Ecosystem diversity"],
          correctAnswer: 2,
          timeLimit: 30
        }
      ],
      createdBy: "admin",
      createdDate: new Date().toISOString(),
      targetAudience: "school"
    },
    {
      id: 2,
      title: "Climate Change 101",
      category: "climate",
      difficulty: "medium",
      questions: [
        {
          id: 1,
          question: "What is the main cause of global warming?",
          options: ["Solar radiation", "Greenhouse gases", "Ocean currents", "Volcanic activity"],
          correctAnswer: 1,
          timeLimit: 45
        },
        {
          id: 2,
          question: "Which gas is the most abundant greenhouse gas?",
          options: ["Methane", "Carbon Dioxide", "Nitrous oxide", "Ozone"],
          correctAnswer: 1,
          timeLimit: 45
        }
      ],
      createdBy: "admin",
      createdDate: new Date().toISOString(),
      targetAudience: "school"
    }
  ];
}

// Default college quizzes
function getDefaultCollegeQuizzes() {
  return [
    {
      id: 101,
      title: "Advanced Climate Science",
      category: "climate",
      difficulty: "hard",
      questions: [
        {
          id: 1,
          question: "What is the carbon cycle and its major components?",
          options: ["Atmosphere-Biosphere-Lithosphere", "Only atmospheric CO2", "Ocean-Atmosphere exchange", "All of above"],
          correctAnswer: 3,
          timeLimit: 60
        },
        {
          id: 2,
          question: "How do anthropogenic activities affect the carbon cycle?",
          options: ["Increase CO2 emissions", "Reduce forest cover", "Alter atmospheric composition", "All correct"],
          correctAnswer: 3,
          timeLimit: 60
        }
      ],
      createdBy: "admin",
      createdDate: new Date().toISOString(),
      targetAudience: "college"
    },
    {
      id: 102,
      title: "Circular Economy Principles",
      category: "sustainability",
      difficulty: "medium",
      questions: [
        {
          id: 1,
          question: "What are the 3 principles of circular economy?",
          options: ["Reduce, Reuse, Recycle", "Design, Make, Dispose", "Produce, Consume, Waste", "Source, Process, Distribute"],
          correctAnswer: 0,
          timeLimit: 50
        }
      ],
      createdBy: "admin",
      createdDate: new Date().toISOString(),
      targetAudience: "college"
    }
  ];
}

// Export user data as JSON
function exportUserData(userId) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.email === userId);
  const performance = getUserPerformance(userId);
  
  const data = {
    user: user,
    performance: performance,
    exportDate: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${user.name}_data_${Date.now()}.json`;
  link.click();
}

// Logout
function logout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('adminSession');
  window.location.href = 'index.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeStorage();
});
