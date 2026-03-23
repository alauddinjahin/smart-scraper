'use strict';

class SanitiserService {

  sanitiseScrapedData(data) {
    if (!data) return {};

    const { admission, tuitionFees, eligibility, scholarships } = data;

    const cleanAdmission = admission ? {
      applicationDeadline: admission.applicationDeadline
        ? String(admission.applicationDeadline).slice(0, 200)
        : null,
      requirementsText: admission.requirementsText
        ? String(admission.requirementsText).slice(0, 2000)
        : null,
      intakeMonths: (() => {
        const v = admission.intakeMonths;
        if (!v) return null;
        if (Array.isArray(v)) return v.filter(Boolean).join(', ').slice(0, 500) || null;
        return String(v).slice(0, 500);
      })(),
      applyUrl: admission.applyUrl
        ? String(admission.applyUrl).slice(0, 500)
        : null,
    } : null;

    const cleanFees = (tuitionFees || []).map(f => ({
      program: String(f.program || 'General').slice(0, 100),
      amountLocal: (typeof f.amountLocal === 'number' && isFinite(f.amountLocal))
        ? f.amountLocal : null,
      amountUSD: (typeof f.amountUSD === 'number' && isFinite(f.amountUSD))
        ? f.amountUSD : null,
      currency: String(f.currency || 'BDT').slice(0, 10),
      period: String(f.period || 'per semester').slice(0, 50),
    }));

    const cleanEligibility = eligibility ? {
      minGPA: (() => {
        const v = eligibility.minGPA;
        if (v === null || v === undefined) return null;
        return String(v).slice(0, 20) || null;
      })(),
      languageReqs: eligibility.languageReqs
        ? String(eligibility.languageReqs).slice(0, 500) : null,
      otherRequirements: eligibility.otherRequirements
        ? String(eligibility.otherRequirements).slice(0, 2000) : null,
    } : null;

    const cleanScholarships = (scholarships || []).map(s => ({
      name: String(s.name || 'Scholarship').slice(0, 255),
      amount: (() => {
        const v = s.amount;
        if (v === null || v === undefined) return null;
        return String(v).slice(0, 200) || null;
      })(),
      eligibility: s.eligibility ? String(s.eligibility).slice(0, 1000) : null,
      deadline: s.deadline ? String(s.deadline).slice(0, 200) : null,
    }));

    return {
      admission: cleanAdmission,
      tuitionFees: cleanFees,
      eligibility: cleanEligibility,
      scholarships: cleanScholarships,
    };
  }

}

module.exports = new SanitiserService();