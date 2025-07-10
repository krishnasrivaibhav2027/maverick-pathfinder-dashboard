import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { motion, Variants } from "framer-motion";

const accent = "#FF512F";
const glass = "bg-white/60 backdrop-blur-md shadow-2xl border border-white/30";
const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

const subcourseVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.18 + custom * 0.07, type: 'spring', stiffness: 90, damping: 18 },
  }),
};

export default function CourseDetailPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:8000/courses");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
        } else {
          console.error("Failed to fetch courses: Server responded with status", res.status);
          setCourses([]);
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const { courseId: courseIdString } = useParams(); // Rename to avoid confusion
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;

  // courseIdString is the ID from the URL, always a string.
  // No parsing needed if we compare string to string.

  const course = useMemo(() => {
    if (!courseIdString || courses.length === 0) {
      return undefined;
    }
    // Compare courseIdString directly with stringified c.course_id
    return courses.find(c => String(c.course_id) === courseIdString);
  }, [courses, courseIdString]);

  const subcourses = useMemo(() => {
    return course ? course.subcourses : [];
  }, [course]);

  const handleBack = () => {
    // courseIdString is appropriate here for navigation state for focusing
    if (user && user.empId && courseIdString) {
      navigate(`/trainee-dashboard/${user.empId}`, {
        state: { user, courseIdToFocus: courseIdString, previousPage: 'courseDetail' },
      });
    } else {
      // Fallback if user or courseId is somehow missing
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* You can replace this with a more sophisticated spinner component if available */}
          <h2 className="text-2xl font-bold mb-2">Loading course details...</h2>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you are looking for does not exist or could not be loaded.</p>
          <Button onClick={handleBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7f0 100%)" }}>
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="outline"
          className="mb-6 flex items-center gap-2 rounded-full px-5 py-2 font-semibold border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80"
          style={font}
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <motion.div
          layoutId={`course-block-${course.course_id}`}
          initial={{ opacity: 0, scale: 0.96, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 32 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className={`rounded-3xl ${glass} p-8 shadow-xl mb-8`}
          style={{ boxShadow: `0 8px 32px 0 ${accent}22` }}
        >
          <h2 className="text-2xl font-bold mb-4" style={font}>{course.title}</h2>
          <div className="space-y-4">
            {subcourses.length === 0 ? (
              <div className="text-gray-500">No subcourses found.</div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{}}
                className="space-y-4"
              >
                {subcourses.map((sub, i) => (
                  <motion.div
                    key={sub.id}
                    custom={i}
                    variants={subcourseVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-0 rounded-xl border border-orange-200 bg-white/90 shadow transition-all duration-200 cursor-pointer min-h-[72px] hover:bg-orange-50 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 will-change-transform"
                    whileTap={{ scale: 0.97, boxShadow: '0 8px 32px 0 #f59e4244', backgroundColor: '#fff7f0' }}
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-3 justify-between px-6 py-4 select-none rounded-xl focus:outline-none">
                      <div className="flex items-center gap-3">
                        {sub.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-500" />
                        )}
                        <span className="text-lg font-semibold group-hover:text-orange-600 transition-colors duration-300">{sub.title}</span>
                      </div>
                      <Badge 
                        variant={sub.status === "completed" ? "default" : sub.status === "in-progress" ? "default" : "secondary"}
                        className="rounded-full px-3 py-1 text-base font-semibold"
                      >
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-orange-300" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 