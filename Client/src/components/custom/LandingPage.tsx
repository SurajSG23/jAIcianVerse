import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LayoutTextFlip } from "../../components/ui/layout-text-flip";
import { motion } from "motion/react";
import { Link } from "react-scroll";
import { FaInstagram, FaLinkedin, FaGithub } from "react-icons/fa";
import AuthCarousel from "../../components/custom/AuthCarousel";

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [getStarted, setGetStarted] = useState(false);

  const featuredPosts = [
    {
      id: 1,
      image: "collaborate-hub.jpeg",
      title: "Collaborative Learning Hub",
      description:
        "Engage with peers through study groups, Q&A discussions, and shared resources to enhance learning and academic collaboration.",
    },
    {
      id: 2,
      image: "rag-chatbot.jpg",
      title: "RAG-Powered Chatbot",
      description:
        "Ask questions directly from uploaded notes and materials. The AI provides accurate, context-aware answers based on your semester content.",
    },
    {
      id: 3,
      image: "ai-teacher.jpg",
      title: "AI Teacher Avatar",
      description:
        "Interactive virtual teacher that explains concepts in a conversational way, perfect for quick revisions and conceptual clarity.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {getStarted && <AuthCarousel setGetStarted={setGetStarted} />}
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#0b0b0b]/35 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold tracking-tight">
                j<span className="text-orange-400">AI</span>cian
                <span className="text-orange-400">Verse</span>
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="home"
                smooth={true}
                duration={500}
                className="cursor-pointer text-[#cccccc] hover:text-[orange] transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                to="about"
                smooth={true}
                duration={500}
                className="cursor-pointer text-[#cccccc] hover:text-[orange] transition-colors duration-200"
              >
                About Us
              </Link>
              <Link
                to="highlights"
                smooth={true}
                duration={500}
                className="cursor-pointer text-[#cccccc] hover:text-[orange] transition-colors duration-200"
              >
                Highlights
              </Link>
              <Link
                to="contact"
                smooth={true}
                duration={500}
                className="cursor-pointer text-[#cccccc] hover:text-[orange] transition-colors duration-200"
              >
                Contact
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-[orange] transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0b0b0b] border-t border-gray-800 animate-fade-in">
            <div className="px-4 pt-2 pb-4 space-y-2 flex flex-col">
              <Link
                to="home"
                smooth={true}
                duration={500}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="cursor-pointer text-white hover:text-[orange] transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                to="about"
                smooth={true}
                duration={500}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="cursor-pointer text-white hover:text-[orange] transition-colors duration-200"
              >
                About Us
              </Link>
              <Link
                to="highlights"
                smooth={true}
                duration={500}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="cursor-pointer text-white hover:text-[orange] transition-colors duration-200"
              >
                Highlights
              </Link>
              <Link
                to="contact"
                smooth={true}
                duration={500}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="cursor-pointer text-white hover:text-[orange] transition-colors duration-200"
              >
                Contact
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-start overflow-hidden"
        id="home"
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="SJCE.jpg"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-[#0b0b0b]/20 via-[#0b0b0b]/85 to-[#0b0b0b]/100"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl lg:text-4xl font-light mb-6 leading-tight tracking-wide">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 text-6xl">
              <span className="text-white">j</span>AI
              <span className="text-white">cian</span>Verse
            </span>
          </h1>
          {/* Animated word flip section */}
          <div>
            <motion.div className="relative mx-4 my-4 flex flex-col items-center justify-center gap-4 text-center sm:mx-0 sm:mb-0 sm:flex-row">
              <LayoutTextFlip
                text="Empowering learners through "
                words={[
                  "AI-Powered Tutoring",
                  "Smart Study Assistants",
                  "Collaborative Learning",
                  "Personalized Dashboards",
                  "Interactive Q&A",
                  "RAG-Driven Knowledge",
                  "Virtual Teacher Avatars",
                  "Easy Resource Sharing",
                ]}
              />
            </motion.div>
            <p className="mt-4 text-center text-sm sm:text-base text-gray-400">
              Experience the next evolution of digital education with immersive,
              dynamic, and human-like AI interaction.
            </p>
          </div>

          <button
            className="relative cursor-pointer mt-4 p-4 text-center font-barlow inline-flex justify-center text-base uppercase text-white rounded-lg border-solid transition-transform duration-300 ease-in-out group outline-offset-4 focus:outline focus:outline-2 focus:outline-white focus:outline-offset-4 overflow-hidden"
            onClick={() => setGetStarted(true)}
          >
            <span className="relative z-20">Get Started</span>

            <span className="absolute left-[-75%] top-0 h-full w-[50%] bg-white/20 rotate-12 z-10 blur-lg group-hover:left-[125%] transition-all duration-1000 ease-in-out"></span>

            <span className="w-1/2 drop-shadow-3xl transition-all duration-300 block border-[#D4EDF9] absolute h-[20%] rounded-tl-lg border-l-2 border-t-2 top-0 left-0"></span>
            <span className="w-1/2 drop-shadow-3xl transition-all duration-300 block border-[#D4EDF9] absolute group-hover:h-[90%] h-[60%] rounded-tr-lg border-r-2 border-t-2 top-0 right-0"></span>
            <span className="w-1/2 drop-shadow-3xl transition-all duration-300 block border-[#D4EDF9] absolute h-[60%] group-hover:h-[90%] rounded-bl-lg border-l-2 border-b-2 left-0 bottom-0"></span>
            <span className="w-1/2 drop-shadow-3xl transition-all duration-300 block border-[#D4EDF9] absolute h-[20%] rounded-br-lg border-r-2 border-b-2 right-0 bottom-0"></span>
          </button>
        </div>
      </section>

      {/* About Us section */}
      <section
        className="relative py-20 bg-black text-white overflow-hidden"
        id="about"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 to-black opacity-90"></div>

        <div className="relative max-w-6xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl sm:text-5xl font-medium mb-6 tracking-tight">
            About Us
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            <span className="text-white font-medium">
              j<span className="text-orange-400">AI</span>cian
              <span className="text-orange-400">Verse</span>
            </span>{" "}
            is an AI-powered educational ecosystem built exclusively for{" "}
            <span className="text-white font-medium">
              JSS Science and Technology University (JSSSTU)
            </span>{" "}
            students and professors. It’s designed to transform traditional
            academics into an intelligent, interactive, and collaborative
            learning experience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {/* Mission */}
            <div className="p-6 bg-neutral-900 rounded-2xl shadow-lg hover:shadow-[0_0_25px_rgba(230,57,70,0.3)] transition-all duration-300">
              <h3 className="text-2xl font-medium mb-3">Our Mission</h3>
              <p className="text-gray-400 leading-relaxed">
                To create a smart academic ecosystem where every JSSSTU student
                can learn, collaborate, and grow through AI-assisted tools,
                meaningful discussions, and real-time feedback.
              </p>
            </div>

            {/* Vision */}
            <div className="p-6 bg-neutral-900 rounded-2xl shadow-lg hover:shadow-[0_0_25px_rgba(230,57,70,0.3)] transition-all duration-300">
              <h3 className="text-2xl font-medium mb-3">Our Vision</h3>
              <p className="text-gray-400 leading-relaxed">
                To empower both students and professors at JSSSTU by integrating
                Artificial Intelligence into academics — making learning more
                personalized, data-driven, and efficient.
              </p>
            </div>

            {/* What We Offer */}
            <div className="p-6 bg-neutral-900 rounded-2xl shadow-lg hover:shadow-[0_0_25px_rgba(230,57,70,0.3)] transition-all duration-300">
              <h3 className="text-2xl font-medium mb-3">What We Offer</h3>
              <p className="text-gray-400 leading-relaxed">
                AI-powered study modules, community-driven discussions,
                professor-led insights, and intelligent learning tools — all
                tailored for your JSSSTU semester and branch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        id="highlights"
      >
        <h2 className="text-4xl sm:text-5xl font-medium mb-16 text-center">
          Platform Highlights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPosts.map((post) => (
            <div
              key={post.id}
              className="group bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800 hover:border-[orange] transition-all duration-300 hover:transform hover:scale-105 hover:shadow-[0_0_30px_rgba(230,57,70,0.2)]"
            >
              {/* Card Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-transparent opacity-60"></div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <h3 className="text-2xl font-medium mb-3 group-hover:text-[orange] transition-colors duration-200">
                  {post.title}
                </h3>
                <p className="text-[#cccccc] mb-6 leading-relaxed">
                  {post.description ||
                    "Explore interactive AI-driven learning tools, semester-specific dashboards, and collaborative student communities."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer
        className="bg-[#0d0d0d] border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8 mt-20"
        id="contact"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="text-white font-medium">
                  j<span className="text-orange-400">AI</span>cian
                  <span className="text-orange-400">Verse</span>
                </span>
              </h3>
              <p className="text-[#cccccc] text-sm">
                Creating inspiring content for creative minds.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
              <div className="space-y-2">
                <a
                  href="https://www.jssstuniv.in/#/"
                  className="block text-[#cccccc] hover:text-[orange] transition-colors text-sm cursor-pointer"
                  target="_blank"
                >
                  JSS Science and Technology University
                </a>
                <a
                  href="https://studentportal.universitysolutions.in/index.html"
                  className="block text-[#cccccc] hover:text-[orange] transition-colors text-sm cursor-pointer"
                  target="_blank"
                >
                  Student Portal
                </a>
                <a
                  href="https://central.sjceplacements.org/login"
                  className="block text-[#cccccc] hover:text-[orange] transition-colors text-sm cursor-pointer"
                  target="_blank"
                >
                  Placement Cell
                </a>
                <a
                  href="https://jssatem.azurewebsites.net/Apps/Login.aspx"
                  className="block text-[#cccccc] hover:text-[orange] transition-colors text-sm cursor-pointer"
                  target="_blank"
                >
                  Fees/Feedback Portal
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold mb-4 text-lg">Follow Us</h4>
              <div className="flex space-x-4">
                <button className="hover:bg-gray-800 hover:text-[orange]">
                  <a
                    href="https://www.instagram.com/suraj_sg23/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <FaInstagram size={20} />
                  </a>
                </button>

                <button className="hover:bg-gray-800 hover:text-[orange]">
                  <a
                    href="https://www.linkedin.com/in/suraj-s-g-dhanva-995a23298/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
                    <FaLinkedin size={20} />
                  </a>
                </button>

                <button className="hover:bg-gray-800 hover:text-[orange]">
                  <a
                    href="https://github.com/SurajSG23"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                  >
                    <FaGithub size={20} />
                  </a>
                </button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-[#cccccc] text-sm">
              &copy; {new Date().getFullYear()} jAIcianVerse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
