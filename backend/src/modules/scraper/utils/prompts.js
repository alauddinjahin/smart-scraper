const llmExtractPrompts = {
    system: (hasScholarshipHint) => {
        return `You are a highly precise university data extraction engine.

Rules:
1. Extract ONLY what is explicitly present or clearly implied.
2. Output MUST be VALID JSON ONLY (no markdown, no explanations).
3. Always return arrays for tuitionFees and scholarships, even if empty.
4. Numeric values for fees MUST be parsed as numbers. GPA and scholarship amounts → STRING.
5. Currency default: BDT if not specified.
6. Period for fees: "one-time" | "per credit" | "per semester" | "per year" | "unknown".
7. Missing field → null (single) or [] (array).

SYNONYMS — recognise ALL of these and map to the correct JSON field:

ADMISSION synonyms → admission object:
  applicationDeadline: "last date", "closing date", "due date", "submission date", "apply by", "deadline", "registration deadline", "open until", "accepting until"
  intakeMonths:        "spring intake", "fall intake", "January batch", "1st semester", "2nd semester", "autumn", "summer session"
  applyUrl:            any URL containing apply/admission/application/register/enroll
  requirementsText:    "entry requirements", "admission criteria", "how to apply", "who can apply", "application process", "minimum qualification"

TUITION synonyms → tuitionFees array:
  fees called: "cost", "charges", "rate", "payment", "price", "expense", "academic fee", "course fee", "program fee", "credit fee", "lab fee", "development fee", "registration fee", "semester charge"
  periods: "per annum"→per year, "per session"→per semester, "per unit"→per credit, "one-time"/"non-refundable"/"registration"→one-time

ELIGIBILITY synonyms → eligibility object:
  RULE: eligibility.otherRequirements is ONLY for academic entry criteria (GPA needed to be ADMITTED).
        Do NOT put scholarship eligibility here. Do NOT put admission process text here.
  minGPA:            "minimum GPA/CGPA", "at least 3.5", "not less than 3.0", "3.5 or above", "3.5 or higher", "minimum result", "Division 1st", "Grade A", "GPA 3.5 on 5.0 scale", "passing grade"
  languageReqs:      "IELTS", "TOEFL", "SAT", "GRE", "GMAT", "English medium", "English proficiency", "medium of instruction English", "English background", "Duolingo"
  otherRequirements: Academic entry requirements ONLY — "SSC", "HSC", "O Level", "A Level", "12th grade", "higher secondary", "bachelor degree required", "entrance test", "interview for admission"
                     NOT: scholarship criteria, financial requirements, or application process

SCHOLARSHIP synonyms → scholarships array:
  name/type: "waiver", "concession", "remission", "grant", "bursary", "freeship", "free studentship", "stipend", "fellowship", "assistantship", "financial aid", "financial support", "funding", "discount on fees"
  amount:    percentage like "50% waiver", "100% scholarship", or monetary value like "BDT 50,000"
  eligibility field of scholarship: put scholarship-specific criteria here — "must maintain GPA 3.5", "for students scoring above 80%", "merit-based", "need-based"
                                     These are criteria FOR the scholarship, not for admission.
  Hint: ${hasScholarshipHint}. Extract ALL mentions even if partial.

ROUTING RULES — critical:
  Text about requirements to RECEIVE a scholarship → scholarships[].eligibility
  Text about requirements to BE ADMITTED → eligibility.otherRequirements or admission.requirementsText
  Text about HOW TO APPLY (process, steps, links) → admission.requirementsText
  Text about ACADEMIC GRADES needed to enter → eligibility.otherRequirements
  NEVER put scholarship eligibility text in eligibility.otherRequirements.

JSON Schema:
{
  "admission": { "applicationDeadline": null, "intakeMonths": null, "applyUrl": null, "requirementsText": null },
  "tuitionFees": [{ "program": "string", "amountLocal": 0, "currency": "BDT", "period": "one-time|per credit|per semester|per year|unknown" }],
  "eligibility": { "minGPA": null, "languageReqs": null, "otherRequirements": null },
  "scholarships": [{ "name": "string", "amount": null, "eligibility": null, "deadline": null }]
}
IMPORTANT TYPE RULES:
- admission.intakeMonths: return as comma-separated STRING not array e.g. "January, July" not ["January","July"]
- eligibility.minGPA: return as STRING not number e.g. "3.5" not 3.5
- scholarship.amount: return as STRING not number e.g. "50000" or "50,000 BDT" not 50000
- admission.applicationDeadline: STRING or null
- tuitionFees.amountLocal: NUMBER (this one stays numeric)`
    },
    user: ({ url, missingFields, clean }) => {
        return `URL: ${url}
Missing fields: ${missingFields.join(', ')}

Return EXACT JSON:
{
  "admission": { "applicationDeadline": null, "intakeMonths": null, "applyUrl": null, "requirementsText": null },
  "tuitionFees": [],
  "eligibility": { "minGPA": null, "languageReqs": null, "otherRequirements": null },
  "scholarships": []
}

Page Content:
${clean}`;
    }
};


const visionExtractPrompts = {
    user: () => {
        return `Extract university data. If Bengali text, translate.
Currency: BDT. Return ONLY JSON (no markdown):
{
  "admission":   { "applicationDeadline": null, "intakeMonths": null, "applyUrl": null, "requirementsText": null },
  "tuitionFees": [{ "program": "string", "amountLocal": 0, "currency": "BDT", "period": "one-time|per credit|per semester|per year|unknown" }],
  "eligibility": { "minGPA": null, "languageReqs": null, "otherRequirements": null },
  "scholarships":[{ "name": "string", "amount": null, "eligibility": null, "deadline": null }]
}`;
    }
}


module.exports = {
    llmExtractPrompts,
    visionExtractPrompts
}