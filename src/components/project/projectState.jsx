"use client";

import { useState, useEffect } from "react";

export const useProjectForm = () => {
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    type: "",
    name: "",
    enrollment: "",
    major: "",
    member1: "",
    member1Enrollment: "",
    member2: "",
    member2Enrollment: "",
    member3: "",
    member3Enrollment: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [status, setStatus] = useState("pending");
  const [errors, setErrors] = useState({});
  const [allowResubmit, setAllowResubmit] = useState(false);

  // Check previous submission status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/check_submission_status?enrollment=${form.enrollment}&type=${form.type}`);
        const data = await res.json();
        if (data.exists) {
          setIsSubmitted(!data.allowResubmit);
          setStatus(data.status);
          setAllowResubmit(data.allowResubmit);
          setMessage(`Submission found (status: ${data.status}).`);
        }
      } catch (err) {
        console.error("Error checking submission status", err);
      }
    };

    if (form.enrollment && form.type) checkStatus();
  }, [form.enrollment, form.type]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Basic validation for required fields
  const validateForm = () => {
    const requiredFields = ["title", "abstract", "type", "name", "enrollment", "major"];
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!form[field]?.trim()) {
        newErrors[field] = "This field is required.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrors({});

    try {
      const response = await fetch(`/api/submit_internship_project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (["submitted", "resubmitted"].includes(data.status)) {
        setIsSubmitted(true);
        setStatus("pending");
        setMessage(`Project ${data.status} successfully.`);
      } else {
        setMessage(data.message || "Error submitting project.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setMessage("Error submitting project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    handleChange,
    handleSubmit,
    loading,
    isSubmitted,
    status,
    message,
    errors,
    allowResubmit,
  };
};
