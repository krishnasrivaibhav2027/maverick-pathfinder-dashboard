import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { motion, Variants } from "framer-motion";

// Mock data (replace with real data as needed)
const phaseOneTrainings = [
  { id: "1", title: "Programming Fundamentals", status: "completed" },
  { id: "2", title: "Object-Oriented Programming (OOP) Concepts", status: "in-progress" },
  { id: "3", title: "Version Control with Git & GitHub", status: "pending" },
  { id: "4", title: "Database Fundamentals", status: "pending" },
  { id: "5", title: "Software Development Lifecycle & Agile Basics", status: "pending" },
  { id: "6", title: "Basic Data Structures & Algorithms", status: "pending" },
  { id: "7", title: "Debugging & Problem Solving", status: "pending" },
  { id: "101", title: "Python Programming Essentials", status: "pending" },
  { id: "102", title: "Intro to Python Libraries (NumPy, Pandas, Requests, Matplotlib)", status: "pending" },
];
const defaultSubcourses = [
  { id: "-1", title: "Introduction", status: "completed" },
  { id: "-2", title: "Core Concepts", status: "in-progress" },
  { id: "-3", title: "Practical Examples", status: "pending" },
  { id: "-4", title: "Common Pitfalls", status: "pending" },
  { id: "-5", title: "Best Practices", status: "pending" },
  { id: "-6", title: "Mini Project", status: "pending" },
  { id: "-7", title: "Quiz & Assessment", status: "pending" },
];
const subcoursesMap: Record<string, { id: string; title: string; status: string }[]> = {
  "1": [
    { id: "1-1", title: "Variables & Data Types", status: "completed" },
    { id: "1-2", title: "Control Structures", status: "pending" },
    { id: "1-3", title: "Functions & Modules", status: "pending" },
    { id: "1-4", title: "Input & Output", status: "in-progress" },
    { id: "1-5", title: "Error Handling", status: "pending" },
    { id: "1-6", title: "Loops & Iteration", status: "completed" },
    { id: "1-7", title: "Basic Algorithms", status: "pending" },
  ],
  "2": [
    { id: "2-1", title: "Classes & Objects", status: "in-progress" },
    { id: "2-2", title: "Inheritance & Polymorphism", status: "pending" },
    { id: "2-3", title: "Encapsulation", status: "pending" },
    { id: "2-4", title: "Abstraction", status: "completed" },
    { id: "2-5", title: "Interfaces & Abstract Classes", status: "pending" },
    { id: "2-6", title: "Composition vs Inheritance", status: "pending" },
    { id: "2-7", title: "OOP Design Patterns", status: "pending" },
  ],
  "3": [
    { id: "3-1", title: "Git Basics", status: "pending" },
    { id: "3-2", title: "Collaboration with GitHub", status: "pending" },
    { id: "3-3", title: "Branching & Merging", status: "in-progress" },
    { id: "3-4", title: "Resolving Conflicts", status: "pending" },
    { id: "3-5", title: "Rebasing & Cherry-pick", status: "pending" },
    { id: "3-6", title: "Git Workflows", status: "completed" },
    { id: "3-7", title: "Tagging & Releases", status: "pending" },
  ],
  "4": defaultSubcourses.map((s, i) => ({ ...s, id: `4${s.id}` })),
  "5": defaultSubcourses.map((s, i) => ({ ...s, id: `5${s.id}` })),
  "6": defaultSubcourses.map((s, i) => ({ ...s, id: `6${s.id}` })),
  "7": defaultSubcourses.map((s, i) => ({ ...s, id: `7${s.id}` })),
  "101": [
    { id: "101-1", title: "Python Syntax & Variables", status: "completed" },
    { id: "101-2", title: "Control Flow in Python", status: "pending" },
    { id: "101-3", title: "Functions & Modules", status: "pending" },
    { id: "101-4", title: "File I/O", status: "in-progress" },
    { id: "101-5", title: "Error Handling in Python", status: "pending" },
    { id: "101-6", title: "Python Data Structures", status: "completed" },
    { id: "101-7", title: "Simple Python Project", status: "pending" },
  ],
  "102": [
    { id: "102-1", title: "NumPy Basics", status: "pending" },
    { id: "102-2", title: "Pandas DataFrames", status: "pending" },
    { id: "102-3", title: "Requests Library", status: "in-progress" },
    { id: "102-4", title: "Matplotlib Plotting", status: "pending" },
    { id: "102-5", title: "Data Analysis Workflow", status: "pending" },
    { id: "102-6", title: "Mini Data Project", status: "pending" },
    { id: "102-7", title: "Quiz & Assessment", status: "pending" },
  ],
};

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
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = phaseOneTrainings.find(c => c.id === courseId);
  const subcourses = subcoursesMap[courseId as string] || [];

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <Button onClick={() => navigate(-1)}>Back</Button>
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
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <motion.div
          layoutId={`course-block-${course.id}`}
          initial={{ opacity: 0, scale: 0.96, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 32 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className={`rounded-3xl ${glass} p-8 shadow-xl mb-8`}
          style={{ boxShadow: `0 8px 32px 0 ${accent}22`, overflow: 'hidden' }}
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
              >
                {subcourses.map((sub, i) => (
                  <motion.div
                    key={sub.id}
                    custom={i}
                    variants={subcourseVariants}
                    initial="hidden"
                    animate="visible"
                    className={`rounded-xl border border-orange-200 bg-white/90 shadow transition-all duration-200 cursor-pointer min-h-[64px] hover:bg-orange-50 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 will-change-transform flex items-center justify-between px-6 py-4`}
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-3">
                      {sub.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                      <span className="text-lg font-semibold">{sub.title}</span>
                    </div>
                    <Badge 
                      variant={sub.status === "completed" ? "default" : sub.status === "in-progress" ? "default" : "secondary"}
                      className="rounded-full px-3 py-1 text-base font-semibold"
                    >
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-orange-300" />
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