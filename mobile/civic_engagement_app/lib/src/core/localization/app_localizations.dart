import 'package:flutter/material.dart';

class AppLocalizations {
  const AppLocalizations(this.locale);

  final Locale locale;

  static const supportedLocales = [
    Locale('en'),
    Locale('am'),
    Locale('om'),
    Locale('ti'),
  ];

  static const delegate = _AppLocalizationsDelegate();

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  String t(String key) {
    final language = _values[locale.languageCode] ?? _values['en']!;
    return language[key] ?? _values['en']![key] ?? key;
  }

  static String languageName(String code) {
    switch (code) {
      case 'am':
        return 'Amharic';
      case 'om':
        return 'Afaan Oromo';
      case 'ti':
        return 'Tigrigna';
      default:
        return 'English';
    }
  }

  static const _values = <String, Map<String, String>>{
    'en': {
      // Language names
      'language.english': 'English',
      'language.amharic': 'Amharic',
      'language.oromo': 'Afaan Oromo',
      'language.tigrigna': 'Tigrigna',

      // Theme
      'theme.title': 'Theme',
      'theme.system': 'System',
      'theme.light': 'Light',
      'theme.dark': 'Dark',

      // Translation
      'translate': 'Translate',
      'translate_policy_card': 'Translate policy',
      'translate_policy_to': 'Translate policy to',
      'translating': 'Translating...',
      'show_original': 'Show original',
      'show_translation': 'Show translation',
      'translate_to': 'Translate to',
      'translation_failed': 'Translation is unavailable right now.',
      'select_language': 'Select language',

      // Navigation
      'account': 'Account',
      'language': 'Language',
      'preferred_language': 'Preferred translation language',
      'policies': 'Policies',
      'personalized_feed': 'Personalized Feed',
      'history': 'My votes',
      'notifications': 'Notifications',
      'policy_details': 'Policy Details',
      'overview': 'Overview',
      'discussion': 'Discussion',

      // Common actions
      'refresh': 'Refresh',
      'logout': 'Logout',
      'cancel': 'Cancel',
      'submit': 'Submit',
      'continue': 'Continue',
      'back': 'Back',

      // Landing Page
      'landing.title': 'Your Voice in\nAction',
      'landing.subtitle':
          'Engage with local policies, submit feedback, and make a real impact directly from your device.',
      'landing.slide_vote_title': 'Vote on policies that affect your area',
      'landing.slide_vote_subtitle':
          'Review proposals, understand the details, and cast a secure vote once for each policy.',
      'landing.slide_translate_title': 'Read public policy in your language',
      'landing.slide_translate_subtitle':
          'Translate policy titles and descriptions without clutter so every citizen can follow the conversation.',
      'landing.slide_track_title': 'Track alerts, history, and outcomes',
      'landing.slide_track_subtitle':
          'Stay updated on policy changes, revisit your votes, and keep your account preferences in one place.',
      'landing.get_started': 'Get Started',
      'landing.login': 'Log In',
      'landing.already_have_account': 'Already have an account?',

      // Auth Page
      'auth.app_name': 'Civic Voice',
      'auth.tagline':
          'Review active public policies, vote once, and track your feedback.',
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.reset_password': 'Reset Password',
      'auth.verify': 'Verify',
      'auth.forgot_password': 'Forgot Password?',
      'auth.no_account': "Don't have an account?",
      'auth.have_account': 'Already have an account?',

      // Login Form
      'login.email': 'Email',
      'login.password': 'Password',
      'login.captcha': 'CAPTCHA token',
      'login.captcha_hint': 'Required only when enabled by the server',
      'login.button': 'Login',
      'login.email_required': 'Email is required',
      'login.password_required': 'Password is required',

      // Register Form
      'register.email': 'Email',
      'register.password': 'Password',
      'register.phone': 'Phone',
      'register.phone_hint': '+251912345678',
      'register.captcha': 'CAPTCHA token',
      'register.captcha_hint': 'Required only when enabled by the server',
      'register.location_title': 'Location Verification',
      'register.location_detecting': 'Detecting your region from GPS...',
      'register.location_info':
          'For security, we verify your region using GPS automatically.',
      'register.region': 'Detected Region',
      'register.location_detected': '✅ Location detected: ',
      'register.location_enable':
          'Please enable location services. Your region will be detected automatically when you return.',
      'register.location_required':
          'Location is required. Please enable GPS so your region can be detected automatically.',
      'register.demographics_title': 'Demographic Information',
      'register.demographics_info':
          'This helps us understand community needs better.',
      'register.age_range': 'Age Range',
      'register.gender': 'Gender',
      'register.occupation': 'Occupation',
      'register.education': 'Education Level',
      'register.age_required': 'Please select your age range',
      'register.gender_required': 'Please select your gender',
      'register.occupation_required': 'Please select your occupation',
      'register.education_required': 'Please select your education level',
      'register.button': 'Create account',
      'register.email_required': 'Email is required',
      'register.password_required': 'Password is required',
      'register.phone_required': 'Phone is required',

      // Verify Form
      'verify.title': 'Verify Your Email',
      'verify.description':
          'Enter the 6-digit code sent to your email address.',
      'verify.email': 'Email',
      'verify.otp': '6-digit OTP',
      'verify.button': 'Verify and continue',
      'verify.resend': 'Send OTP again',
      'verify.email_required': 'Email is required',
      'verify.otp_required': 'OTP code is required',

      // Reset Password Form
      'reset.description':
          'Enter your email address and we will send you a reset token.',
      'reset.create_password': 'Create New Password',
      'reset.create_description':
          'Enter the reset token from your email and create a new password.',
      'reset.email': 'Email',
      'reset.request_button': 'Request reset email',
      'reset.token': 'Reset token',
      'reset.new_password': 'New password',
      'reset.confirm_password': 'Confirm password',
      'reset.button': 'Reset password',
      'reset.email_required': 'Email is required',
      'reset.token_required': 'Reset token is required',
      'reset.password_required': 'New password is required',

      // Bottom Navigation
      'nav.policies': 'Policies',
      'nav.feed': 'For You',
      'nav.history': 'History',
      'nav.notifications': 'Alerts',
      'nav.account': 'Account',

      // Policy List Page
      'policies.title': 'Policies',
      'policies.all': 'All',
      'policies.active': 'Active',
      'policies.closed': 'Closed',
      'policies.empty': 'No policies found',
      'policies.empty_message':
          'Check back later for new policies to review and vote on.',

      // Feed Page
      'feed.title': 'For You',
      'feed.empty': 'No new policies',
      'feed.empty_message':
          'You are all caught up! Check back later for new personalized policy recommendations.',

      // History Page
      'history.title': 'My Votes',
      'history.empty': 'No voting history',
      'history.empty_message':
          'Your voting history will appear here after you cast your first vote.',
      'history.voted_on': 'Voted on',

      // Account Page
      'account.title': 'Account',
      'account.profile': 'Profile',
      'account.email': 'Email',
      'account.phone': 'Phone',
      'account.region': 'Region',
      'account.settings': 'Settings',
      'account.language': 'Language',
      'account.theme': 'Theme',
      'account.preferences': 'Preferences',
      'account.security': 'Security & Account',
      'account.logout': 'Logout',
      'account.logout_confirm': 'Are you sure you want to logout?',
      'account.logout_yes': 'Yes, Logout',
      'account.logout_no': 'Cancel',

      // Policy Detail
      'policy.vote': 'Vote',
      'policy.comment': 'Comment',
      'policy.share': 'Share',
      'policy.report': 'Report',
      'policy.about_title': 'About this policy',
      'policy.status.active': 'Active',
      'policy.status.closed': 'Closed',
      'policy.status.draft': 'Draft',
      'policy.ends': 'Ends',
      'policy.votes': 'votes',
      'policy.comments': 'comments',

      // Voting
      'vote.submit': 'Submit Vote',
      'vote.already_voted': 'Already Voted',
      'vote.checking_history': 'Checking Vote History',
      'vote.checking_history_message':
          'We are confirming whether you have already voted on this policy.',
      'vote.success': 'Vote submitted successfully!',
      'vote.error': 'Failed to submit vote',

      // Comments
      'comment.post': 'Post Comment',
      'comment.reply': 'Reply',
      'comment.edit': 'Edit',
      'comment.delete': 'Delete',
      'comment.report': 'Report',
      'comment.placeholder': 'Share your thoughts...',
      'comment.empty': 'No comments yet',
      'comment.empty_message':
          'Be the first to share your thoughts on this policy.',

      // Errors
      'error.generic': 'Something went wrong',
      'error.network': 'Network error. Please check your connection.',
      'error.retry': 'Retry',

      // Additional Policy List
      'policies.citizen_workspace': 'Citizen Workspace',
      'policies.your_region': 'Your Region',
      'policies.topics': 'Topics',
      'policies.clear': 'Clear',
      'policies.load_more': 'Load more',

      // Additional Policy Card
      'policies.rating': 'Rating',

      // Additional Comments
      'comment.official_reply': 'Official Reply',
      'comment.edited': 'Edited',
      'comment.edited_version': 'Edited v',
      'comment.view_replies': 'replies',
      'comment.view_reply': 'reply',
      'comment.autonomous_citizen': 'Autonomous Citizen',
      'comment.deleted': 'Deleted',
      'comment.hidden': 'Hidden',
      'comment.reported': 'Reported',
      'comment.appeal': 'Appeal Decision',

      // Additional Account
      'account.verified': 'Verified',
      'account.unverified': 'Unverified',
      'account.become_planner': 'Become a Planner',
      'account.planner_description':
          'Planners can create and manage policy proposals. Apply to become a planner if you work in policy development.',
      'account.request_planner': 'Request Planner Status',
      'account.region_update': 'Region Update',
      'account.gps_required': 'GPS Verification Required',
      'account.gps_description':
          'For security, region updates require GPS verification. Enable location services and tap the button below.',
      'account.current_region': 'Current Region',
      'account.detect_location': 'Detect my location',
      'account.password_change': 'Password',
      'account.current_password': 'Current password',
      'account.new_password': 'New password',
      'account.change_password': 'Change password',
      'account.email_change': 'Email change',
      'account.new_email': 'New email',
      'account.send_code': 'Send verification code',
      'account.verification_code': 'Verification code',
      'account.verify_email': 'Verify email',
      'account.session': 'Session',
      'account.data_account': 'Data & Account',
      'account.export_description':
          'Export your data before deleting your account. This includes profile, votes, comments, notifications, messages, and planner requests.',
      'account.export_data': 'Export my data',
      'account.delete_account': 'Delete account',
      'account.delete_confirm': 'Delete account?',
      'account.delete_warning':
          'Your account will be anonymized and deactivated. This cannot be undone.',
      'account.export_saved': 'Export saved',
      'account.done': 'Done',
    },
    'am': {
      // Language names
      'language.english': 'እንግሊዝኛ',
      'language.amharic': 'አማርኛ',
      'language.oromo': 'Afaan Oromo',
      'language.tigrigna': 'ትግርኛ',
      // Theme
      'theme.title': 'ገጽታ',
      'theme.system': 'ስርዓት',
      'theme.light': 'ብርሃን',
      'theme.dark': 'ጨለማ',
      // Translation
      'translate': 'ተርጉም',
      'translate_policy_card': 'ፖሊሲውን ተርጉም',
      'translate_policy_to': 'ፖሊሲውን ወደ',
      'translating': 'በመተርጎም ላይ...',
      'show_original': 'ዋናውን አሳይ',
      'show_translation': 'ትርጉሙን አሳይ',
      'translate_to': 'ወደ',
      'translation_failed': 'ትርጉም አሁን አይገኝም።',
      'select_language': 'ቋንቋ ይምረጡ',
      // Navigation
      'account': 'መለያ',
      'language': 'ቋንቋ',
      'preferred_language': 'የትርጉም ቋንቋ',
      'policies': 'ፖሊሲዎች',
      'personalized_feed': 'የእርስዎ ምክሮች',
      'history': 'የእኔ ድምጾች',
      'notifications': 'ማሳወቂያዎች',
      'policy_details': 'የፖሊሲ ዝርዝር',
      'overview': 'አጠቃላይ',
      'discussion': 'ውይይት',
      // Common actions
      'refresh': 'አድስ',
      'logout': 'ውጣ',
      'cancel': 'ሰርዝ',
      'submit': 'አስገባ',
      'continue': 'ቀጥል',
      'back': 'ተመለስ',
      // Landing Page
      'landing.title': 'ድምጽዎ በድርጊት',
      'landing.subtitle':
          'በአካባቢያዊ ፖሊሲዎች ላይ ይሳተፉ፣ አስተያየት ያስገቡ እና ከመሳሪያዎ በቀጥታ እውነተኛ ተጽእኖ ያድርጉ።',
      'landing.slide_vote_title': 'አካባቢዎን በሚነኩ ፖሊሲዎች ላይ ድምጽ ይስጡ',
      'landing.slide_vote_subtitle':
          'ሀሳቦችን ይመልከቱ፣ ዝርዝሩን ይረዱ፣ እና ለእያንዳንዱ ፖሊሲ አንድ ጊዜ ድምጽ ይስጡ።',
      'landing.slide_translate_title': 'ፖሊሲን በቋንቋዎ ያንብቡ',
      'landing.slide_translate_subtitle':
          'የፖሊሲ ርዕሶችን እና መግለጫዎችን በግልጽ መልኩ ይተርጉሙ።',
      'landing.slide_track_title': 'ማሳወቂያዎችን፣ ታሪክን እና ውጤቶችን ይከታተሉ',
      'landing.slide_track_subtitle':
          'የፖሊሲ ለውጦችን ይከታተሉ፣ ድምጾችዎን ይመልከቱ፣ እና ምርጫዎችዎን ያስተዳድሩ።',
      'landing.get_started': 'ጀምር',
      'landing.login': 'ግባ',
      'landing.already_have_account': 'መለያ አለዎት?',
      // Auth Page
      'auth.app_name': 'የዜጎች ድምጽ',
      'auth.tagline': 'ንቁ የህዝብ ፖሊሲዎችን ይገምግሙ፣ አንድ ጊዜ ድምጽ ይስጡ እና አስተያየትዎን ይከታተሉ።',
      'auth.login': 'ግባ',
      'auth.register': 'ተመዝገብ',
      'auth.reset_password': 'የይለፍ ቃል ዳግም አስጀምር',
      'auth.verify': 'አረጋግጥ',
      'auth.forgot_password': 'የይለፍ ቃል ረሱ?',
      'auth.no_account': 'መለያ የለዎትም?',
      'auth.have_account': 'ቀድሞውኑ መለያ አለዎት?',
      // Login Form
      'login.email': 'ኢሜይል',
      'login.password': 'የይለፍ ቃል',
      'login.captcha': 'CAPTCHA ቶከን',
      'login.captcha_hint': 'በአገልጋዩ ሲነቃ ብቻ ያስፈልጋል',
      'login.button': 'ግባ',
      'login.email_required': 'ኢሜይል ያስፈልጋል',
      'login.password_required': 'የይለፍ ቃል ያስፈልጋል',
      // Register Form
      'register.email': 'ኢሜይል',
      'register.password': 'የይለፍ ቃል',
      'register.phone': 'ስልክ',
      'register.phone_hint': '+251912345678',
      'register.captcha': 'CAPTCHA ቶከን',
      'register.captcha_hint': 'በአገልጋዩ ሲነቃ ብቻ ያስፈልጋል',
      'register.location_title': 'የአካባቢ ማረጋገጫ',
      'register.location_detecting': 'ክልልዎን ከGPS እየተገኘ ነው...',
      'register.location_info': 'ለደህንነት፣ ክልልዎን በGPS በራስ-ሰር እናረጋግጣለን።',
      'register.region': 'የተገኘ ክልል',
      'register.location_detected': '✅ አካባቢ ተገኝቷል: ',
      'register.location_enable':
          'እባክዎ የአካባቢ አገልግሎቶችን ያንቁ። ክልልዎ ሲመለሱ በራስ-ሰር ይገኛል።',
      'register.location_required':
          'አካባቢ ያስፈልጋል። እባክዎ GPS ያንቁ ስለዚህ ክልልዎ በራስ-ሰር ሊገኝ ይችላል።',
      'register.demographics_title': 'የስነ-ሕዝብ መረጃ',
      'register.demographics_info': 'ይህ የማህበረሰብ ፍላጎቶችን በተሻለ ሁኔታ እንድንረዳ ይረዳናል።',
      'register.age_range': 'የዕድሜ ክልል',
      'register.gender': 'ጾታ',
      'register.occupation': 'ሙያ',
      'register.education': 'የትምህርት ደረጃ',
      'register.age_required': 'እባክዎ የዕድሜ ክልልዎን ይምረጡ',
      'register.gender_required': 'እባክዎ ጾታዎን ይምረጡ',
      'register.occupation_required': 'እባክዎ ሙያዎን ይምረጡ',
      'register.education_required': 'እባክዎ የትምህርት ደረጃዎን ይምረጡ',
      'register.button': 'መለያ ፍጠር',
      'register.email_required': 'ኢሜይል ያስፈልጋል',
      'register.password_required': 'የይለፍ ቃል ያስፈልጋል',
      'register.phone_required': 'ስልክ ያስፈልጋል',
      // Verify Form
      'verify.title': 'ኢሜይልዎን ያረጋግጡ',
      'verify.description': 'ወደ ኢሜይል አድራሻዎ የተላከውን 6-አሃዝ ኮድ ያስገቡ።',
      'verify.email': 'ኢሜይል',
      'verify.otp': '6-አሃዝ OTP',
      'verify.button': 'አረጋግጥ እና ቀጥል',
      'verify.resend': 'OTP እንደገና ላክ',
      'verify.email_required': 'ኢሜይል ያስፈልጋል',
      'verify.otp_required': 'OTP ኮድ ያስፈልጋል',
      // Reset Password Form
      'reset.description': 'የኢሜይል አድራሻዎን ያስገቡ እና የዳግም ማስጀመሪያ ቶከን እንልክልዎታለን።',
      'reset.create_password': 'አዲስ የይለፍ ቃል ፍጠር',
      'reset.create_description':
          'ከኢሜይልዎ የዳግም ማስጀመሪያ ቶከን ያስገቡ እና አዲስ የይለፍ ቃል ይፍጠሩ።',
      'reset.email': 'ኢሜይል',
      'reset.request_button': 'የዳግም ማስጀመሪያ ኢሜይል ጠይቅ',
      'reset.token': 'የዳግም ማስጀመሪያ ቶከን',
      'reset.new_password': 'አዲስ የይለፍ ቃል',
      'reset.confirm_password': 'የይለፍ ቃል ያረጋግጡ',
      'reset.button': 'የይለፍ ቃል ዳግም አስጀምር',
      'reset.email_required': 'ኢሜይል ያስፈልጋል',
      'reset.token_required': 'የዳግም ማስጀመሪያ ቶከን ያስፈልጋል',
      'reset.password_required': 'አዲስ የይለፍ ቃል ያስፈልጋል',

      // Bottom Navigation
      'nav.policies': 'ፖሊሲዎች',
      'nav.feed': 'ለእርስዎ',
      'nav.history': 'ታሪክ',
      'nav.notifications': 'ማሳወቂያዎች',
      'nav.account': 'መለያ',

      // Policy List Page
      'policies.title': 'ፖሊሲዎች',
      'policies.all': 'ሁሉም',
      'policies.active': 'ንቁ',
      'policies.closed': 'ተዘግቷል',
      'policies.empty': 'ምንም ፖሊሲዎች አልተገኙም',
      'policies.empty_message':
          'ለመገምገም እና ድምጽ ለመስጠት አዳዲስ ፖሊሲዎችን ለማግኘት በኋላ ይመልሱ።',

      // Feed Page
      'feed.title': 'ለእርስዎ',
      'feed.empty': 'አዳዲስ ፖሊሲዎች የሉም',
      'feed.empty_message': 'ሁሉንም ተከታትለዋል! አዳዲስ የግል ፖሊሲ ምክሮችን ለማግኘት በኋላ ይመልሱ።',

      // History Page
      'history.title': 'የእኔ ድምጾች',
      'history.empty': 'የድምጽ ታሪክ የለም',
      'history.empty_message': 'የድምጽ ታሪክዎ የመጀመሪያ ድምጽዎን ከሰጡ በኋላ እዚህ ይታያል።',
      'history.voted_on': 'ድምጽ ተሰጥቷል በ',

      // Account Page
      'account.title': 'መለያ',
      'account.profile': 'መገለጫ',
      'account.email': 'ኢሜይል',
      'account.phone': 'ስልክ',
      'account.region': 'ክልል',
      'account.settings': 'ቅንብሮች',
      'account.language': 'ቋንቋ',
      'account.theme': 'ገጽታ',
      'account.preferences': 'ምርጫዎች',
      'account.security': 'ደህንነት እና መለያ',
      'account.logout': 'ውጣ',
      'account.logout_confirm': 'በእርግጥ መውጣት ይፈልጋሉ?',
      'account.logout_yes': 'አዎ፣ ውጣ',
      'account.logout_no': 'ሰርዝ',

      // Policy Detail
      'policy.vote': 'ድምጽ',
      'policy.comment': 'አስተያየት',
      'policy.share': 'አጋራ',
      'policy.report': 'ሪፖርት',
      'policy.about_title': 'ስለዚህ ፖሊሲ',
      'policy.status.active': 'ንቁ',
      'policy.status.closed': 'ተዘግቷል',
      'policy.status.draft': 'ረቂቅ',
      'policy.ends': 'ያበቃል',
      'policy.votes': 'ድምጾች',
      'policy.comments': 'አስተያየቶች',

      // Voting
      'vote.submit': 'ድምጽ አስገባ',
      'vote.already_voted': 'አስቀድመው ድምጽ ሰጥተዋል',
      'vote.checking_history': 'የድምጽ ታሪክ በመፈተሽ ላይ',
      'vote.checking_history_message':
          'በዚህ ፖሊሲ ላይ አስቀድመው ድምጽ ሰጥተው እንደሆነ እናረጋግጣለን።',
      'vote.success': 'ድምጽ በተሳካ ሁኔታ ገብቷል!',
      'vote.error': 'ድምጽ ማስገባት አልተሳካም',

      // Comments
      'comment.post': 'አስተያየት ለጥፍ',
      'comment.reply': 'መልስ',
      'comment.edit': 'አርትዕ',
      'comment.delete': 'ሰርዝ',
      'comment.report': 'ሪፖርት',
      'comment.placeholder': 'ሀሳብዎን ያጋሩ...',
      'comment.empty': 'ገና አስተያየቶች የሉም',
      'comment.empty_message': 'በዚህ ፖሊሲ ላይ ሀሳብዎን የሚያጋሩ የመጀመሪያው ይሁኑ።',

      // Errors
      'error.generic': 'የሆነ ችግር ተፈጥሯል',
      'error.network': 'የኔትወርክ ስህተት። እባክዎ ግንኙነትዎን ያረጋግጡ።',
      'error.retry': 'እንደገና ሞክር',

      // Additional Policy List
      'policies.citizen_workspace': 'የዜጎች የስራ ቦታ',
      'policies.your_region': 'የእርስዎ ክልል',
      'policies.topics': 'ርዕሶች',
      'policies.clear': 'አጽዳ',
      'policies.load_more': 'ተጨማሪ ጫን',

      // Additional Policy Card
      'policies.rating': 'ደረጃ',

      // Additional Comments
      'comment.official_reply': 'ኦፊሴላዊ መልስ',
      'comment.edited': 'ተስተካክሏል',
      'comment.edited_version': 'ተስተካክሏል v',
      'comment.view_replies': 'መልሶች',
      'comment.view_reply': 'መልስ',
      'comment.autonomous_citizen': 'ራስ ገዝ ዜጋ',
      'comment.deleted': 'ተሰርዟል',
      'comment.hidden': 'ተደብቋል',
      'comment.reported': 'ሪፖርት ተደርጓል',
      'comment.appeal': 'ውሳኔ ይግባኝ',

      // Additional Account
      'account.verified': 'ተረጋግጧል',
      'account.unverified': 'አልተረጋገጠም',
      'account.become_planner': 'እቅድ አውጪ ይሁኑ',
      'account.planner_description':
          'እቅድ አውጪዎች የፖሊሲ ሀሳቦችን መፍጠር እና ማስተዳደር ይችላሉ። በፖሊሲ ልማት ውስጥ የሚሰሩ ከሆነ እቅድ አውጪ ለመሆን ያመልክቱ።',
      'account.request_planner': 'የእቅድ አውጪ ደረጃ ጠይቅ',
      'account.region_update': 'የክልል ማሻሻያ',
      'account.gps_required': 'የGPS ማረጋገጫ ያስፈልጋል',
      'account.gps_description':
          'ለደህንነት፣ የክልል ማሻሻያዎች የGPS ማረጋገጫ ያስፈልጋቸዋል። የአካባቢ አገልግሎቶችን ያንቁ እና ከታች ያለውን ቁልፍ መታ ያድርጉ።',
      'account.current_region': 'የአሁኑ ክልል',
      'account.detect_location': 'አካባቢዬን አግኝ',
      'account.password_change': 'የይለፍ ቃል',
      'account.current_password': 'የአሁኑ የይለፍ ቃል',
      'account.new_password': 'አዲስ የይለፍ ቃል',
      'account.change_password': 'የይለፍ ቃል ቀይር',
      'account.email_change': 'ኢሜይል ለውጥ',
      'account.new_email': 'አዲስ ኢሜይል',
      'account.send_code': 'የማረጋገጫ ኮድ ላክ',
      'account.verification_code': 'የማረጋገጫ ኮድ',
      'account.verify_email': 'ኢሜይል አረጋግጥ',
      'account.session': 'ክፍለ ጊዜ',
      'account.data_account': 'መረጃ እና መለያ',
      'account.export_description':
          'መለያዎን ከመሰረዝዎ በፊት መረጃዎን ይላኩ። ይህ መገለጫ፣ ድምጾች፣ አስተያየቶች፣ ማሳወቂያዎች፣ መልዕክቶች እና የእቅድ አውጪ ጥያቄዎችን ያካትታል።',
      'account.export_data': 'መረጃዬን ላክ',
      'account.delete_account': 'መለያ ሰርዝ',
      'account.delete_confirm': 'መለያ ይሰረዝ?',
      'account.delete_warning': 'መለያዎ ስም-አልባ እና ቦዝኗል። ይህ መልሰው ሊመለስ አይችልም።',
      'account.export_saved': 'ላኪ ተቀምጧል',
      'account.done': 'ተከናውኗል',
    },
    'om': {
      // Language names
      'language.english': 'Ingiliffa',
      'language.amharic': 'Afaan Amaaraa',
      'language.oromo': 'Afaan Oromo',
      'language.tigrigna': 'Afaan Tigiree',
      // Theme
      'theme.title': 'Bifa',
      'theme.system': 'Sirna',
      'theme.light': 'Ifa',
      'theme.dark': 'Dukkana',
      // Translation
      'translate': 'Hiiki',
      'translate_policy_card': 'Imaammata hiiki',
      'translate_policy_to': 'Imaammata gara',
      'translating': 'Hiikamaa jira...',
      'show_original': 'Isa jalqabaa agarsiisi',
      'show_translation': 'Hiikkaa agarsiisi',
      'translate_to': 'Gara',
      'translation_failed': 'Tajaajilli hiikaa amma hin jiru.',
      'select_language': 'Afaan filadhu',
      // Navigation
      'account': 'Herrega',
      'language': 'Afaan',
      'preferred_language': 'Afaan hiikaa filatame',
      'policies': 'Imaammata',
      'personalized_feed': 'Yaada siif qophaa\'e',
      'history': 'Sagalee koo',
      'notifications': 'Beeksisa',
      'policy_details': 'Bal\'ina imaammataa',
      'overview': 'Cuunfaa',
      'discussion': 'Mari\'annoo',
      // Common actions
      'refresh': 'Haaromsi',
      'logout': 'Ba\'i',
      'cancel': 'Dhiisi',
      'submit': 'Galchi',
      'continue': 'Itti fufi',
      'back': 'Deebi\'i',
      // Landing Page
      'landing.title': 'Sagaleen Kee\nHojii Keessatti',
      'landing.subtitle':
          'Imaammata naannoo keessanii irratti hirmaadhu, yaada kennuu fi meeshaa keessan irraa kallattiin dhiibbaa dhugaa uumuu.',
      'landing.slide_vote_title':
          'Imaammata naannoo kee tuqu irratti sagalee kenni',
      'landing.slide_vote_subtitle':
          'Yaada ilaali, balʼinaan hubadhu, imaammata hundaaf yeroo tokko sagalee kenni.',
      'landing.slide_translate_title': 'Imaammata afaan keetiin dubbisi',
      'landing.slide_translate_subtitle':
          'Mata duree fi ibsa imaammataa karaa qulqulluu taʼeen hiiki.',
      'landing.slide_track_title': 'Beeksisa, seenaa fi buʼaa hordofi',
      'landing.slide_track_subtitle':
          'Jijjiirama imaammataa hordofi, sagalee kee deebiʼi ilaali, filannoo kee bulchi.',
      'landing.get_started': 'Jalqabi',
      'landing.login': 'Seeni',
      'landing.already_have_account': 'Herirega qabdaa?',
      // Auth Page
      'auth.app_name': 'Sagalee Lammii',
      'auth.tagline':
          'Imaammata ummataa socho\'oo gamaaggamu, al tokko sagalee kennuu fi yaada keessan hordofaa.',
      'auth.login': 'Seeni',
      'auth.register': 'Galmaa\'i',
      'auth.reset_password': 'Jecha iccitii haaromsi',
      'auth.verify': 'Mirkaneessi',
      'auth.forgot_password': 'Jecha iccitii irraanfatte?',
      'auth.no_account': 'Herrega hin qabdu?',
      'auth.have_account': 'Duraan herrega qabdaa?',
      // Login Form
      'login.email': 'Imeelii',
      'login.password': 'Jecha iccitii',
      'login.captcha': 'Tookenii CAPTCHA',
      'login.captcha_hint': 'Yeroo tajaajilaan dandeessisu qofa barbaachisa',
      'login.button': 'Seeni',
      'login.email_required': 'Imeeliin barbaachisaadha',
      'login.password_required': 'Jecha iccitiin barbaachisaadha',
      // Register Form
      'register.email': 'Imeelii',
      'register.password': 'Jecha iccitii',
      'register.phone': 'Bilbila',
      'register.phone_hint': '+251912345678',
      'register.captcha': 'Tookenii CAPTCHA',
      'register.captcha_hint': 'Yeroo tajaajilaan dandeessisu qofa barbaachisa',
      'register.location_title': 'Mirkaneessaa Bakka',
      'register.location_detecting': 'Naannoo kee GPS irraa argamaa jira...',
      'register.location_info':
          'Nageenyaaf, naannoo kee GPS fayyadamuun ofumaan mirkaneessina.',
      'register.region': 'Naannoo Argame',
      'register.location_detected': '✅ Bakki argame: ',
      'register.location_enable':
          'Maaloo tajaajila bakka dandeessisaa. Naannoon kee yeroo deebitu ofumaan ni argama.',
      'register.location_required':
          'Bakki barbaachisaadha. Maaloo GPS dandeessisaa akka naannoon kee ofumaan argamu.',
      'register.demographics_title': 'Odeeffannoo Uummata',
      'register.demographics_info':
          'Kun fedhii hawaasaa haala gaariin akka hubannuuf nu gargaara.',
      'register.age_range': 'Daangaa Umurii',
      'register.gender': 'Saala',
      'register.occupation': 'Hojii',
      'register.education': 'Sadarkaa Barnoota',
      'register.age_required': 'Maaloo daangaa umurii kee filadhu',
      'register.gender_required': 'Maaloo saala kee filadhu',
      'register.occupation_required': 'Maaloo hojii kee filadhu',
      'register.education_required': 'Maaloo sadarkaa barnoota kee filadhu',
      'register.button': 'Herrega uumi',
      'register.email_required': 'Imeeliin barbaachisaadha',
      'register.password_required': 'Jecha iccitiin barbaachisaadha',
      'register.phone_required': 'Bilbilli barbaachisaadha',
      // Verify Form
      'verify.title': 'Imeelii Kee Mirkaneessi',
      'verify.description':
          'Koodii lakkoofsa 6 gara teessoo imeelii keetitti ergame galchi.',
      'verify.email': 'Imeelii',
      'verify.otp': 'OTP lakkoofsa 6',
      'verify.button': 'Mirkaneessii fi itti fufi',
      'verify.resend': 'OTP ammas ergi',
      'verify.email_required': 'Imeeliin barbaachisaadha',
      'verify.otp_required': 'Koodiin OTP barbaachisaadha',
      // Reset Password Form
      'reset.description':
          'Teessoo imeelii kee galchii fi tookenii haaromsa siif ergina.',
      'reset.create_password': 'Jecha Iccitii Haaraa Uumi',
      'reset.create_description':
          'Tookenii haaromsa imeelii kee irraa galchii fi jecha iccitii haaraa uumi.',
      'reset.email': 'Imeelii',
      'reset.request_button': 'Imeelii haaromsa gaafadhu',
      'reset.token': 'Tookenii haaromsa',
      'reset.new_password': 'Jecha iccitii haaraa',
      'reset.confirm_password': 'Jecha iccitii mirkaneessi',
      'reset.button': 'Jecha iccitii haaromsi',
      'reset.email_required': 'Imeeliin barbaachisaadha',
      'reset.token_required': 'Tookenii haaromsaa barbaachisaadha',
      'reset.password_required': 'Jecha iccitii haaraan barbaachisaadha',

      // Bottom Navigation
      'nav.policies': 'Imaammata',
      'nav.feed': 'Siif',
      'nav.history': 'Seenaa',
      'nav.notifications': 'Beeksisa',
      'nav.account': 'Herrega',

      // Policy List Page
      'policies.title': 'Imaammata',
      'policies.all': 'Hunda',
      'policies.active': 'Socho\'oo',
      'policies.closed': 'Cufame',
      'policies.empty': 'Imaammanni hin argamne',
      'policies.empty_message':
          'Imaammata haaraa gamaaggamuu fi sagalee kennuuf booda deebi\'aa.',

      // Feed Page
      'feed.title': 'Siif',
      'feed.empty': 'Imaammanni haaraan hin jiru',
      'feed.empty_message':
          'Hunda hordofteetta! Yaada imaammata dhuunfaa haaraaf booda deebi\'aa.',

      // History Page
      'history.title': 'Sagalee Koo',
      'history.empty': 'Seenaa sagalee hin jiru',
      'history.empty_message':
          'Seenaan sagalee keetii sagalee jalqabaa kennuu booda as ni mul\'ata.',
      'history.voted_on': 'Sagaleen kenname',

      // Account Page
      'account.title': 'Herrega',
      'account.profile': 'Agarsiisa',
      'account.email': 'Imeelii',
      'account.phone': 'Bilbila',
      'account.region': 'Naannoo',
      'account.settings': 'Qindaa\'ina',
      'account.language': 'Afaan',
      'account.theme': 'Bifa',
      'account.preferences': 'Filannoo',
      'account.security': 'Nageenyaa fi Herrega',
      'account.logout': 'Ba\'i',
      'account.logout_confirm': 'Dhugumatti ba\'uu barbaaddaa?',
      'account.logout_yes': 'Eeyyee, Ba\'i',
      'account.logout_no': 'Dhiisi',

      // Policy Detail
      'policy.vote': 'Sagalee',
      'policy.comment': 'Yaada',
      'policy.share': 'Qoodaa',
      'policy.report': 'Gabaasa',
      'policy.about_title': 'Waa\'ee imaammata kanaa',
      'policy.status.active': 'Socho\'oo',
      'policy.status.closed': 'Cufame',
      'policy.status.draft': 'Qophii',
      'policy.ends': 'Xumura',
      'policy.votes': 'sagaleewwan',
      'policy.comments': 'yaadota',

      // Voting
      'vote.submit': 'Sagalee Galchi',
      'vote.already_voted': 'Duraanuu Sagalee Kenniteetta',
      'vote.checking_history': 'Seenaa Sagalee Ilaalaa Jira',
      'vote.checking_history_message':
          'Imaammata kana irratti dura sagalee kennitee jirtaa moo hin jirre mirkaneessina.',
      'vote.success': 'Sagaleen milkaa\'inaan galche!',
      'vote.error': 'Sagalee galchuun hin milkoofne',

      // Comments
      'comment.post': 'Yaada Maxxansi',
      'comment.reply': 'Deebii',
      'comment.edit': 'Gulaali',
      'comment.delete': 'Haqi',
      'comment.report': 'Gabaasa',
      'comment.placeholder': 'Yaada kee qoodaa...',
      'comment.empty': 'Yaadni amma hin jiru',
      'comment.empty_message':
          'Imaammata kana irratti yaada kee qoodduu jalqabaa ta\'i.',

      // Errors
      'error.generic': 'Wanti tokko dogoggore',
      'error.network':
          'Dogongora networkii. Maaloo walitti dhufeenya kee mirkaneessi.',
      'error.retry': 'Irra deebi\'ii yaali',

      // Additional Policy List
      'policies.citizen_workspace': 'Bakka Hojii Lammii',
      'policies.your_region': 'Naannoo Kee',
      'policies.topics': 'Mata-dureewwan',
      'policies.clear': 'Qulqulleessi',
      'policies.load_more': 'Dabalataa fe\'i',

      // Additional Policy Card
      'policies.rating': 'Madaallii',

      // Additional Comments
      'comment.official_reply': 'Deebii Ofiisaalaa',
      'comment.edited': 'Gulaalamee',
      'comment.edited_version': 'Gulaalamee v',
      'comment.view_replies': 'deebii',
      'comment.view_reply': 'deebii',
      'comment.autonomous_citizen': 'Lammii Ofii-bulchaa',
      'comment.deleted': 'Haqame',
      'comment.hidden': 'Dhokfame',
      'comment.reported': 'Gabaafame',
      'comment.appeal': 'Murtii Iyyannoo',

      // Additional Account
      'account.verified': 'Mirkaneeffame',
      'account.unverified': 'Hin mirkaneeffamne',
      'account.become_planner': 'Karoorfataa Ta\'i',
      'account.planner_description':
          'Karoorfatoonni yaada imaammata uumuu fi bulchuu danda\'u. Misoomaa imaammata keessatti hojjettu yoo ta\'e karoorfataa ta\'uuf iyyannoo galchi.',
      'account.request_planner': 'Sadarkaa Karoorfataa Gaafadhu',
      'account.region_update': 'Fooyya\'iinsa Naannoo',
      'account.gps_required': 'Mirkaneessaa GPS Barbaachisa',
      'account.gps_description':
          'Nageenyaaf, fooyya\'iinsi naannoo mirkaneessaa GPS barbaachisa. Tajaajila bakka dandeessisii fi qabduu armaan gadii tuqi.',
      'account.current_region': 'Naannoo Ammaa',
      'account.detect_location': 'Bakka koo barbaadi',
      'account.password_change': 'Jecha Iccitii',
      'account.current_password': 'Jecha iccitii ammaa',
      'account.new_password': 'Jecha iccitii haaraa',
      'account.change_password': 'Jecha iccitii jijjiiri',
      'account.email_change': 'Jijjiirama Imeelii',
      'account.new_email': 'Imeelii haaraa',
      'account.send_code': 'Koodii mirkaneessaa ergi',
      'account.verification_code': 'Koodii mirkaneessaa',
      'account.verify_email': 'Imeelii mirkaneessi',
      'account.session': 'Yeroo',
      'account.data_account': 'Daataa fi Herrega',
      'account.export_description':
          'Herrega kee haquu dura daataa kee ergadhu. Kun agarsiisa, sagalee, yaada, beeksisa, ergaa fi gaafii karoorfataa of keessaa qaba.',
      'account.export_data': 'Daataa koo ergadhu',
      'account.delete_account': 'Herrega haqi',
      'account.delete_confirm': 'Herrega haqamaa?',
      'account.delete_warning':
          'Herregni kee maqaa-malee fi dhaabbataa ta\'a. Kun deebi\'amee hin danda\'amu.',
      'account.export_saved': 'Ergaa olkaa\'ame',
      'account.done': 'Xumurameera',
    },
    'ti': {
      // Language names
      'language.english': 'እንግሊዝኛ',
      'language.amharic': 'ኣምሓርኛ',
      'language.oromo': 'Afaan Oromo',
      'language.tigrigna': 'ትግርኛ',
      // Theme
      'theme.title': 'ትርኢት',
      'theme.system': 'ስርዓት',
      'theme.light': 'ብርሃን',
      'theme.dark': 'ጸልማት',
      // Translation
      'translate': 'ተርጉም',
      'translate_policy_card': 'ፖሊሲ ተርጉም',
      'translate_policy_to': 'ፖሊሲ ናብ',
      'translating': 'ይትርጎም ኣሎ...',
      'show_original': 'መበቆላዊ ኣርኢ',
      'show_translation': 'ትርጉም ኣርኢ',
      'translate_to': 'ናብ',
      'translation_failed': 'ትርጉም ሕጂ ኣይተረኽበን።',
      'select_language': 'ቋንቋ ምረጽ',
      // Navigation
      'account': 'ሕሳብ',
      'language': 'ቋንቋ',
      'preferred_language': 'ዝተመርጸ ቋንቋ ትርጉም',
      'policies': 'ፖሊሲታት',
      'personalized_feed': 'ናይ ባዕልኻ ምኽሪ',
      'history': 'ድምጽታተይ',
      'notifications': 'መፍለጢታት',
      'policy_details': 'ዝርዝር ፖሊሲ',
      'overview': 'ሓፈሻ',
      'discussion': 'ዘተ',
      // Common actions
      'refresh': 'ኣሐድስ',
      'logout': 'ውጻእ',
      'cancel': 'ሰርዝ',
      'submit': 'ኣቕርብ',
      'continue': 'ቀጽል',
      'back': 'ተመለስ',
      // Landing Page
      'landing.title': 'ድምጽኻ ብግብሪ',
      'landing.subtitle':
          'ኣብ ናይ ከባቢ ፖሊሲታት ተሳተፍ፣ ርእይቶ ኣቕርብ፣ ከምኡውን ካብ መሳርሒኻ ብቐጥታ ናይ ብሓቂ ጽልዋ ግበር።',
      'landing.slide_vote_title': 'ኣብ ንከባቢኻ ዝጸልዉ ፖሊሲታት ድምጺ ሃብ',
      'landing.slide_vote_subtitle':
          'ሓሳባት ርአ፣ ዝርዝር ተረዳእ፣ ንነፍሲ ወከፍ ፖሊሲ ሓንሳብ ድምጺ ሃብ።',
      'landing.slide_translate_title': 'ፖሊሲ ብቋንቋኻ ኣንብብ',
      'landing.slide_translate_subtitle': 'ርእስታትን መግለጺታትን ፖሊሲ ብግልጺ ኣተርጉም።',
      'landing.slide_track_title': 'መፍለጢታት፣ ታሪኽን ውጽኢትን ተኸታተል',
      'landing.slide_track_subtitle':
          'ለውጥታት ፖሊሲ ተኸታተል፣ ድምጽታትካ ዳግም ርአ፣ ምርጫታትካ ኣመሓድር።',
      'landing.get_started': 'ጀምር',
      'landing.login': 'እቶ',
      'landing.already_have_account': 'መለያ ኣለካ?',
      // Auth Page
      'auth.app_name': 'ድምጺ ዜጋ',
      'auth.tagline': 'ንጡፋት ናይ ህዝቢ ፖሊሲታት ግምግም፣ ሓንሳብ ድምጺ ሃብ፣ ከምኡውን ርእይቶኻ ክትትል።',
      'auth.login': 'እቶ',
      'auth.register': 'ተመዝገብ',
      'auth.reset_password': 'ምስጢር ቃል ዳግም ኣቐምጥ',
      'auth.verify': 'ኣረጋግጽ',
      'auth.forgot_password': 'ምስጢር ቃል ረሲዕካዮ?',
      'auth.no_account': 'ሕሳብ የብልካን?',
      'auth.have_account': 'ቀደም ሕሳብ ኣለካ?',
      // Login Form
      'login.email': 'ኢመይል',
      'login.password': 'ምስጢር ቃል',
      'login.captcha': 'ቶከን CAPTCHA',
      'login.captcha_hint': 'ብኣገልጋሊ ምስ ዝንቀሳቐስ ጥራይ የድሊ',
      'login.button': 'እቶ',
      'login.email_required': 'ኢመይል የድሊ',
      'login.password_required': 'ምስጢር ቃል የድሊ',
      // Register Form
      'register.email': 'ኢመይል',
      'register.password': 'ምስጢር ቃል',
      'register.phone': 'ተሌፎን',
      'register.phone_hint': '+251912345678',
      'register.captcha': 'ቶከን CAPTCHA',
      'register.captcha_hint': 'ብኣገልጋሊ ምስ ዝንቀሳቐስ ጥራይ የድሊ',
      'register.location_title': 'ምርግጋጽ ቦታ',
      'register.location_detecting': 'ከባቢኻ ካብ GPS ይርከብ ኣሎ...',
      'register.location_info': 'ንድሕነት፣ ከባቢኻ GPS ብምጥቃም ብኣውቶማቲክ ንረጋግጽ።',
      'register.region': 'ዝተረኽበ ከባቢ',
      'register.location_detected': '✅ ቦታ ተረኺቡ: ',
      'register.location_enable':
          'በጃኻ ናይ ቦታ ኣገልግሎታት ኣንቅሕ። ከባቢኻ ምስ ትምለስ ብኣውቶማቲክ ይርከብ።',
      'register.location_required':
          'ቦታ የድሊ። በጃኻ GPS ኣንቅሕ ከባቢኻ ብኣውቶማቲክ ክርከብ ይኽእል።',
      'register.demographics_title': 'ሓበሬታ ህዝቢ',
      'register.demographics_info': 'እዚ ናይ ማሕበረሰብ ድሌታት ብዝበለጸ ንምርዳእ የሕግዘና።',
      'register.age_range': 'ዕድመ ደረጃ',
      'register.gender': 'ጾታ',
      'register.occupation': 'ስራሕ',
      'register.education': 'ደረጃ ትምህርቲ',
      'register.age_required': 'በጃኻ ዕድመ ደረጃኻ ምረጽ',
      'register.gender_required': 'በጃኻ ጾታኻ ምረጽ',
      'register.occupation_required': 'በጃኻ ስራሕካ ምረጽ',
      'register.education_required': 'በጃኻ ደረጃ ትምህርትኻ ምረጽ',
      'register.button': 'ሕሳብ ፍጠር',
      'register.email_required': 'ኢመይል የድሊ',
      'register.password_required': 'ምስጢር ቃል የድሊ',
      'register.phone_required': 'ተሌፎን የድሊ',
      // Verify Form
      'verify.title': 'ኢመይልካ ኣረጋግጽ',
      'verify.description': 'ናብ ኢመይል ኣድራሻኻ ዝተላእከ 6-ኣሃዝ ኮድ ኣእቱ።',
      'verify.email': 'ኢመይል',
      'verify.otp': '6-ኣሃዝ OTP',
      'verify.button': 'ኣረጋግጽን ቀጽልን',
      'verify.resend': 'OTP ዳግም ስደድ',
      'verify.email_required': 'ኢመይል የድሊ',
      'verify.otp_required': 'ኮድ OTP የድሊ',
      // Reset Password Form
      'reset.description': 'ኢመይል ኣድራሻኻ ኣእቱ ቶከን ዳግም ምጅማር ንሰደልካ።',
      'reset.create_password': 'ሓድሽ ምስጢር ቃል ፍጠር',
      'reset.create_description':
          'ካብ ኢመይልካ ቶከን ዳግም ምጅማር ኣእቱን ሓድሽ ምስጢር ቃል ፍጠርን።',
      'reset.email': 'ኢመይል',
      'reset.request_button': 'ናይ ዳግም ምጅማር ኢመይል ሕተት',
      'reset.token': 'ቶከን ዳግም ምጅማር',
      'reset.new_password': 'ሓድሽ ምስጢር ቃል',
      'reset.confirm_password': 'ምስጢር ቃል ኣረጋግጽ',
      'reset.button': 'ምስጢር ቃል ዳግም ኣቐምጥ',
      'reset.email_required': 'ኢመይል የድሊ',
      'reset.token_required': 'ቶከን ዳግም ምጅማር የድሊ',
      'reset.password_required': 'ሓድሽ ምስጢር ቃል የድሊ',

      // Bottom Navigation
      'nav.policies': 'ፖሊሲታት',
      'nav.feed': 'ንዓኻ',
      'nav.history': 'ታሪኽ',
      'nav.notifications': 'መፍለጢታት',
      'nav.account': 'ሕሳብ',

      // Policy List Page
      'policies.title': 'ፖሊሲታት',
      'policies.all': 'ኩሉ',
      'policies.active': 'ንጡፍ',
      'policies.closed': 'ዝተዓጽወ',
      'policies.empty': 'ፖሊሲ ኣይተረኽበን',
      'policies.empty_message': 'ንምግምጋምን ድምጺ ንምሃብን ሓድሽ ፖሊሲታት ንምርካብ ደሓር ተመለስ።',

      // Feed Page
      'feed.title': 'ንዓኻ',
      'feed.empty': 'ሓድሽ ፖሊሲታት የለን',
      'feed.empty_message': 'ኩሉ ተኸታቲልካዮ! ሓድሽ ናይ ውልቃዊ ፖሊሲ ምኽሪታት ንምርካብ ደሓር ተመለስ።',

      // History Page
      'history.title': 'ድምጽታተይ',
      'history.empty': 'ታሪኽ ድምጺ የለን',
      'history.empty_message': 'ታሪኽ ድምጽኻ ቀዳማይ ድምጽኻ ምስ ትህብ ኣብዚ ይርአ።',
      'history.voted_on': 'ድምጺ ተሃቢዩ',

      // Account Page
      'account.title': 'ሕሳብ',
      'account.profile': 'መገለጺ',
      'account.email': 'ኢመይል',
      'account.phone': 'ተሌፎን',
      'account.region': 'ከባቢ',
      'account.settings': 'ምቅናጻት',
      'account.language': 'ቋንቋ',
      'account.theme': 'ትርኢት',
      'account.preferences': 'ምርጫታት',
      'account.security': 'ድሕንነትን መለለይን',
      'account.logout': 'ውጻእ',
      'account.logout_confirm': 'ብሓቂ ክትውጽእ ትደሊ?',
      'account.logout_yes': 'እወ፣ ውጻእ',
      'account.logout_no': 'ሰርዝ',

      // Policy Detail
      'policy.vote': 'ድምጺ',
      'policy.comment': 'ርእይቶ',
      'policy.share': 'ኣካፍል',
      'policy.report': 'ሪፖርት',
      'policy.about_title': 'ብዛዕባ እዚ ፖሊሲ',
      'policy.status.active': 'ንጡፍ',
      'policy.status.closed': 'ዝተዓጽወ',
      'policy.status.draft': 'ረቂቕ',
      'policy.ends': 'ይውዳእ',
      'policy.votes': 'ድምጽታት',
      'policy.comments': 'ርእይቶታት',

      // Voting
      'vote.submit': 'ድምጺ ኣቕርብ',
      'vote.already_voted': 'ድሮ ድምጺ ሂብካ',
      'vote.checking_history': 'ታሪኽ ድምጺ ይፍተሽ ኣሎ',
      'vote.checking_history_message': 'ኣብዚ ፖሊሲ ድሮ ድምጺ ሂብካ እንተኾንካ ነረጋግጽ ኣለና።',
      'vote.success': 'ድምጺ ብዓወት ቀሪቡ!',
      'vote.error': 'ድምጺ ምቕራብ ኣይተዓወተን',

      // Comments
      'comment.post': 'ርእይቶ ለጥፍ',
      'comment.reply': 'መልሲ',
      'comment.edit': 'ኣርትዕ',
      'comment.delete': 'ሰርዝ',
      'comment.report': 'ሪፖርት',
      'comment.placeholder': 'ሓሳብካ ኣካፍል...',
      'comment.empty': 'ገና ርእይቶታት የለን',
      'comment.empty_message': 'ኣብዚ ፖሊሲ ሓሳብካ ዘካፍል ቀዳማይ ኹን።',

      // Errors
      'error.generic': 'ሓደ ነገር ጌጋ ኮይኑ',
      'error.network': 'ጌጋ መርበብ። በጃኻ ምትእስሳርካ ኣረጋግጽ።',
      'error.retry': 'ዳግም ፈትን',

      // Additional Policy List
      'policies.citizen_workspace': 'ናይ ዜጋ ናይ ስራሕ ቦታ',
      'policies.your_region': 'ከባቢኻ',
      'policies.topics': 'ኣርእስትታት',
      'policies.clear': 'ኣጽርይ',
      'policies.load_more': 'ተወሳኺ ጽዕን',

      // Additional Policy Card
      'policies.rating': 'ደረጃ',

      // Additional Comments
      'comment.official_reply': 'ወግዓዊ መልሲ',
      'comment.edited': 'ተኣርቲዑ',
      'comment.edited_version': 'ተኣርቲዑ v',
      'comment.view_replies': 'መልስታት',
      'comment.view_reply': 'መልሲ',
      'comment.autonomous_citizen': 'ራሱ ዝመሓደረ ዜጋ',
      'comment.deleted': 'ተሰሪዙ',
      'comment.hidden': 'ተሓቢኡ',
      'comment.reported': 'ተሪፖርት ኮይኑ',
      'comment.appeal': 'ውሳኔ ይግባኝ',

      // Additional Account
      'account.verified': 'ተረጋጊጹ',
      'account.unverified': 'ኣይተረጋገጸን',
      'account.become_planner': 'ኣቐዳዲሚ ኹን',
      'account.planner_description':
          'ኣቐዳድምቲ ናይ ፖሊሲ ሓሳባት ክፈጥሩን ክመሓድሩን ይኽእሉ። ኣብ ምዕባለ ፖሊሲ እንተ ትሰርሕ ኣቐዳዲሚ ንምዃን ኣመልክት።',
      'account.request_planner': 'ደረጃ ኣቐዳዲሚ ሕተት',
      'account.region_update': 'ምሕዳስ ከባቢ',
      'account.gps_required': 'ምርግጋጽ GPS የድሊ',
      'account.gps_description':
          'ንድሕነት፣ ምሕዳስ ከባቢ ምርግጋጽ GPS የድሊ። ናይ ቦታ ኣገልግሎታት ኣንቅሕን ኣብ ታሕቲ ዘሎ ቁልፊ ጠውቕን።',
      'account.current_region': 'ናይ ሕጂ ከባቢ',
      'account.detect_location': 'ቦታይ ርኸብ',
      'account.password_change': 'ምስጢር ቃል',
      'account.current_password': 'ናይ ሕጂ ምስጢር ቃል',
      'account.new_password': 'ሓድሽ ምስጢር ቃል',
      'account.change_password': 'ምስጢር ቃል ቀይር',
      'account.email_change': 'ለውጢ ኢመይል',
      'account.new_email': 'ሓድሽ ኢመይል',
      'account.send_code': 'ኮድ ምርግጋጽ ስደድ',
      'account.verification_code': 'ኮድ ምርግጋጽ',
      'account.verify_email': 'ኢመይል ኣረጋግጽ',
      'account.session': 'ክፍለ ግዜ',
      'account.data_account': 'ዳታን ሕሳብን',
      'account.export_description':
          'ሕሳብካ ቅድሚ ምስራዝካ ዳታኻ ላኣኽ። እዚ መገለጺ፣ ድምጽታት፣ ርእይቶታት፣ መፍለጢታት፣ መልእኽትታትን ሕቶታት ኣቐዳድምትን የጠቓልል።',
      'account.export_data': 'ዳታይ ላኣኽ',
      'account.delete_account': 'ሕሳብ ስረዝ',
      'account.delete_confirm': 'ሕሳብ ይስረዝ?',
      'account.delete_warning':
          'ሕሳብካ ስም-ኣልቦን ዝተዓጽወን ይኸውን። እዚ ተመሊሱ ክግበር ኣይክእልን።',
      'account.export_saved': 'ላኣኽ ተቐሚጡ',
      'account.done': 'ተዛዚሙ',
    },
  };
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return AppLocalizations.supportedLocales
        .any((supported) => supported.languageCode == locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
