/**
 * pages.config.js - Page routing configuration with code splitting
 *
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 *
 * Example file structure:
 *
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 *
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';

const AIChat = lazy(() => import('./pages/AIChat'));
const Admin = lazy(() => import('./pages/Admin'));
const AdventureFinder = lazy(() => import('./pages/AdventureFinder'));
const Badges = lazy(() => import('./pages/Badges'));
const CampPlanner = lazy(() => import('./pages/CampPlanner'));
const Cart = lazy(() => import('./pages/Cart'));
const Chat = lazy(() => import('./pages/Chat'));
const ChatInfo = lazy(() => import('./pages/ChatInfo'));
const Clan = lazy(() => import('./pages/Clan'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const CreateCourse = lazy(() => import('./pages/CreateCourse'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const CreateStory = lazy(() => import('./pages/CreateStory'));
const CreateUnitPost = lazy(() => import('./pages/CreateUnitPost'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const EditUnit = lazy(() => import('./pages/EditUnit'));
const Event = lazy(() => import('./pages/Event'));
const Events = lazy(() => import('./pages/Events'));
const Explore = lazy(() => import('./pages/Explore'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Home = lazy(() => import('./pages/Home'));
const LeaderToolkit = lazy(() => import('./pages/LeaderToolkit'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Messages = lazy(() => import('./pages/Messages'));
const MusicLibrary = lazy(() => import('./pages/MusicLibrary'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Post = lazy(() => import('./pages/Post'));
const PostRental = lazy(() => import('./pages/PostRental'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Quiz = lazy(() => import('./pages/Quiz'));
const RequestBadge = lazy(() => import('./pages/RequestBadge'));
const RevenueTracker = lazy(() => import('./pages/RevenueTracker'));
const SellProduct = lazy(() => import('./pages/SellProduct'));
const Settings = lazy(() => import('./pages/Settings'));
const Training = lazy(() => import('./pages/Training'));
const Unit = lazy(() => import('./pages/Unit'));
const ScoutCardGenerator = lazy(() => import('./pages/ScoutCardGenerator'));
const SubscriptionAdmin = lazy(() => import('./pages/SubscriptionAdmin'));
const PaymentGateway = lazy(() => import('./pages/PaymentGateway'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIChat": AIChat,
    "Admin": Admin,
    "AdventureFinder": AdventureFinder,
    "Badges": Badges,
    "CampPlanner": CampPlanner,
    "Cart": Cart,
    "Chat": Chat,
    "ChatInfo": ChatInfo,
    "Clan": Clan,
    "CourseDetail": CourseDetail,
    "CreateCourse": CreateCourse,
    "CreatePost": CreatePost,
    "CreateStory": CreateStory,
    "CreateUnitPost": CreateUnitPost,
    "EditProfile": EditProfile,
    "EditUnit": EditUnit,
    "Event": Event,
    "Events": Events,
    "Explore": Explore,
    "HelpCenter": HelpCenter,
    "Home": Home,
    "LeaderToolkit": LeaderToolkit,
    "Leaderboard": Leaderboard,
    "Marketplace": Marketplace,
    "Messages": Messages,
    "MusicLibrary": MusicLibrary,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Post": Post,
    "PostRental": PostRental,
    "PrivacyPolicy": PrivacyPolicy,
    "ProductDetail": ProductDetail,
    "Profile": Profile,
    "Quiz": Quiz,
    "RequestBadge": RequestBadge,
    "RevenueTracker": RevenueTracker,
    "SellProduct": SellProduct,
    "Settings": Settings,
    "Training": Training,
    "Unit": Unit,
    "ScoutCardGenerator": ScoutCardGenerator,
    "SubscriptionAdmin": SubscriptionAdmin,
    "PaymentGateway": PaymentGateway,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
