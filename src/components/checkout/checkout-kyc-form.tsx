"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "./photo-upload";
import { CheckoutProgress } from "./checkout-progress";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Types matching backend FieldType enum
type FieldType =
  | "TEXT"
  | "DATE"
  | "DROPDOWN"
  | "EMAIL"
  | "PHONE"
  | "YES_NO"
  | "UPLOAD"
  | "COUNTRY"
  | "ZIP_CODE"
  | "TOS_LINK";

interface FieldValidation {
  key: string;
  message: string;
  value?: number;
  condition?: { field: string; equals: string };
}

interface FieldInfo {
  key: string;
  type: FieldType;
  label: string;
  infoText: string;
  placeholder?: string;
  placeholders?: { month: string; day: string; year: string };
  order: number;
  optionsEndpoint?: string;
  validations: FieldValidation[];
  value?: string | boolean;
  valueKey?: string;
}

interface NestedFieldGroup {
  key: string;
  order: number;
  fields: FieldInfo[];
}

interface FormResponse {
  title: string;
  description: string;
  fields?: FieldInfo[];
  nestedFields?: NestedFieldGroup[];
  buttonRules?: Array<{
    conditions: Record<string, string[]>;
    submit: boolean;
    label?: string;
  }>;
  autofill?: { email?: string; phoneNumber?: string };
}

interface CheckoutKycFormProps {
  provider: "walapay" | "bridge";
  token: string;
  prefillCountry?: string;
  prefillEmail?: string;
  onComplete: () => void;
  onError: (msg: string) => void;
}

export function CheckoutKycForm({
  provider,
  token,
  prefillCountry,
  prefillEmail,
  onComplete,
  onError,
}: CheckoutKycFormProps) {
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormResponse | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [allSubmittedData, setAllSubmittedData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stepNumber, setStepNumber] = useState(0);
  const [totalSteps, setTotalSteps] = useState(5); // estimate
  const [dropdownOptions, setDropdownOptions] = useState<
    Record<string, Array<{ key: string; label: string }>>
  >({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const headers = { Authorization: `Bearer ${token}` };

  // Get first step via navigation
  const getFirstStep = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/kyc/navigation`,
        {},
        { headers }
      );
      const data = res.data?.data || res.data;
      const nextFlow = data?.nextFlow;
      if (nextFlow) {
        setCurrentFlow(nextFlow);
        await loadFormStep(nextFlow);
      } else {
        // No steps needed — KYC already done
        onComplete();
      }
    } catch (err) {
      onError("Failed to start verification process");
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load form schema for a specific step
  const loadFormStep = async (flowKey: string) => {
    setLoading(true);
    try {
      const prefix = provider === "bridge" ? "bridge" : "walapay";
      const res = await axios.get(`${API_URL}/${prefix}/kyc/${flowKey}`, {
        headers,
      });
      const data = res.data?.data || res.data;
      setFormData(data);

      // Pre-populate form values from existing data
      const values: Record<string, unknown> = {};
      const allFields = getAllFields(data);
      for (const field of allFields) {
        if (field.value !== undefined) {
          values[field.key] = field.value;
        }
      }
      // Add autofill values
      if (data?.autofill) {
        if (data.autofill.email) values.email = data.autofill.email;
        if (data.autofill.phoneNumber)
          values.phoneNumber = data.autofill.phoneNumber;
      }
      // Autofill from checkout page data
      if (prefillCountry && !values.country) values.country = prefillCountry;
      if (prefillEmail && !values.email) values.email = prefillEmail;
      setFormValues(values);

      // Load dropdown options for any DROPDOWN fields
      for (const field of allFields) {
        if (
          (field.type === "DROPDOWN" || field.type === "COUNTRY") &&
          field.optionsEndpoint
        ) {
          loadDropdownOptions(field.key, field.optionsEndpoint);
        }
      }
    } catch {
      onError("Failed to load verification form");
    }
    setLoading(false);
  };

  // Load dropdown options from endpoint
  const loadDropdownOptions = async (fieldKey: string, endpoint: string) => {
    try {
      // Fix endpoint path — backend returns paths like "/api/walapay/countries"
      // but API_URL already includes "/api", so strip it
      let path = endpoint;
      if (path.startsWith("/api/")) {
        path = path.replace("/api/", "/");
      } else if (!path.startsWith("/")) {
        path = `/${path}`;
      }
      const url = `${API_URL}${path}`;
      const res = await axios.get(url, { headers });
      const responseData = res.data?.data || res.data;

      // Options can be at .options (countries, id-types) or directly an array
      const options = responseData?.options || (Array.isArray(responseData) ? responseData : []);
      if (Array.isArray(options) && options.length > 0) {
        setDropdownOptions((prev) => ({ ...prev, [fieldKey]: options }));
      }
    } catch {
      // Options load failed — try with the countries from our local data as fallback
      if (fieldKey.toLowerCase().includes("country")) {
        const { countries } = await import("@/lib/data/countries");
        setDropdownOptions((prev) => ({
          ...prev,
          [fieldKey]: countries.map((c) => ({ key: c.code, label: `${c.flag} ${c.name}` })),
        }));
      }
    }
  };

  // Get all fields from form data (flat + nested)
  const getAllFields = (data: FormResponse | null): FieldInfo[] => {
    if (!data) return [];
    const fields: FieldInfo[] = [...(data.fields || [])];
    for (const group of data.nestedFields || []) {
      fields.push(...group.fields);
    }
    return fields.sort((a, b) => a.order - b.order);
  };

  // Submit current step and navigate to next
  const handleSubmit = async () => {
    if (!currentFlow) return;
    setSubmitting(true);
    setFieldErrors({});

    try {
      // Merge current form values with all previously submitted data
      const merged = { ...allSubmittedData, ...formValues };
      setAllSubmittedData(merged);

      // Get next step via navigation
      const navRes = await axios.post(
        `${API_URL}/kyc/navigation`,
        { currentFlow, ...merged },
        { headers }
      );
      const navData = navRes.data?.data || navRes.data;
      const nextFlow = navData?.nextFlow;

      if (nextFlow) {
        // More steps to fill — don't submit to provider yet
        setCurrentFlow(nextFlow);
        setStepNumber((s) => s + 1);
        await loadFormStep(nextFlow);
      } else {
        // All steps complete — NOW submit everything to the provider
        const prefix = provider === "bridge" ? "bridge" : "walapay";
        try {
          await axios.post(`${API_URL}/${prefix}/kyc`, merged, { headers });
        } catch (submitErr) {
          if (axios.isAxiosError(submitErr)) {
            const errMsg = submitErr.response?.data?.message || submitErr.message;
            // Parse field-level errors from backend message
            const errors = parseFieldErrors(errMsg);
            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors);
              onError("Please fix the highlighted fields and try again.");
            } else {
              onError(errMsg);
            }
          } else {
            onError("Failed to submit verification data");
          }
          setSubmitting(false);
          return;
        }
        onComplete();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errMsg = err.response?.data?.message || err.message;
        const errors = parseFieldErrors(errMsg);
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          onError("يرجى تصحيح الحقول المحددة / Please fix the highlighted fields");
        } else {
          onError(errMsg);
        }
      } else {
        onError("فشل في معالجة التحقق / Failed to process verification");
      }
    }
    setSubmitting(false);
  };

  // Parse backend error messages into field-level errors
  const parseFieldErrors = (message: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    // Backend sends concatenated validation messages
    const parts = message.split(/(?=[a-zA-Z]+\.)|(?=Phone number)|(?=address\.)|(?=government)/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes("Phone number") || trimmed.includes("phoneNumber")) {
        errors.phoneNumber = trimmed;
      } else if (trimmed.includes("address.streetLine1") || trimmed.includes("addressLine1")) {
        errors.addressLine1 = "Street address is required (4-100 characters)";
      } else if (trimmed.includes("address.city")) {
        errors.addressCity = "City is required";
      } else if (trimmed.includes("address.stateRegion") || trimmed.includes("addressState")) {
        errors.addressState = "State/Region is required";
      } else if (trimmed.includes("address.postalCode") || trimmed.includes("addressZipCode")) {
        errors.addressZipCode = "Postal code is required";
      } else if (trimmed.includes("address.countryCode")) {
        errors.country = "Country is required";
      } else if (trimmed.includes("governmentIssuedIdentification.type") || trimmed.includes("governmentIdType")) {
        errors.governmentIdType = "ID type is required";
      } else if (trimmed.includes("governmentIssuedIdentification.number") || trimmed.includes("governmentIdNumber")) {
        errors.governmentIdNumber = "ID number is required";
      } else if (trimmed.includes("governmentIssuedIdentification.countryCode") || trimmed.includes("governmentIdCountryCode")) {
        errors.governmentIdCountryCode = "ID country is required";
      } else if (trimmed.includes("frontImage") || trimmed.includes("governmentIdFrontImage")) {
        errors.governmentIdFrontImage = "Front image of ID is required";
      } else if (trimmed.includes("E.164")) {
        errors.phoneNumber = "Phone must be in international format (e.g. +1234567890)";
      }
    }
    return errors;
  };

  // Initialize
  useEffect(() => {
    getFirstStep();
  }, [getFirstStep]);

  // Update form value
  const setValue = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <CheckoutProgress currentStep={3} totalSteps={5} />
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-yasmin border-t-transparent" />
          <p className="text-sm text-gray-500">Loading verification form...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="space-y-4">
        <CheckoutProgress currentStep={3} totalSteps={5} />
        <p className="text-center text-sm text-red-600">
          Could not load verification form
        </p>
      </div>
    );
  }

  const allFields = getAllFields(formData);

  return (
    <div className="space-y-4">
      <CheckoutProgress currentStep={3} totalSteps={5} />
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {formData.title}
        </h2>
        <p className="text-xs text-gray-500">{formData.description}</p>
      </div>

      <div className="space-y-3">
        {allFields.map((field) => (
          <DynamicField
            key={field.key}
            field={field}
            value={formValues[field.key]}
            onChange={(val) => { setValue(field.key, val); setFieldErrors((prev) => { const n = { ...prev }; delete n[field.key]; return n; }); }}
            dropdownOptions={dropdownOptions[field.key]}
            allValues={formValues}
            error={fieldErrors[field.key]}
          />
        ))}
      </div>

      <Button
        size="lg"
        className="w-full"
        loading={submitting}
        onClick={handleSubmit}
      >
        Continue
      </Button>
    </div>
  );
}

// Dynamic field renderer
function DynamicField({
  field,
  value,
  onChange,
  dropdownOptions,
  allValues,
  error,
}: {
  field: FieldInfo;
  value: unknown;
  onChange: (val: unknown) => void;
  dropdownOptions?: Array<{ key: string; label: string }>;
  allValues: Record<string, unknown>;
  error?: string;
}) {
  // Check conditional visibility — hide field if condition not met
  for (const validation of field.validations) {
    if (validation.key === "requiredWhen" && validation.condition) {
      const depValue = allValues[validation.condition.field];
      if (String(depValue) !== validation.condition.equals) {
        return null; // Hide this field
      }
    }
  }

  switch (field.type) {
    case "TEXT":
    case "EMAIL":
    case "ZIP_CODE":
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          type={field.type === "EMAIL" ? "email" : "text"}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          hint={field.infoText}
          error={error}
        />
      );

    case "PHONE":
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          type="tel"
          inputMode="numeric"
          value={(value as string) || ""}
          onChange={(e) =>
            onChange(e.target.value.replace(/[^0-9+]/g, ""))
          }
          hint={field.infoText}
        />
      );

    case "DATE":
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-yasmin focus:outline-none focus:ring-2 focus:ring-yasmin"
          />
          {field.infoText && (
            <p className="text-xs text-gray-500">{field.infoText}</p>
          )}
        </div>
      );

    case "DROPDOWN":
    case "COUNTRY":
      return (
        <SearchableDropdown
          label={field.label}
          placeholder={field.placeholder || "Select..."}
          options={dropdownOptions || []}
          value={(value as string) || ""}
          onChange={(val) => onChange(val)}
          infoText={field.infoText}
          error={error}
        />
      );

    case "YES_NO":
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange(true)}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                value === true
                  ? "border-yasmin bg-yasmin/10 text-yasmin-dark"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onChange(false)}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                value === false
                  ? "border-yasmin bg-yasmin/10 text-yasmin-dark"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              No
            </button>
          </div>
          {field.infoText && (
            <p className="text-xs text-gray-500">{field.infoText}</p>
          )}
        </div>
      );

    case "UPLOAD":
      return (
        <PhotoUpload
          label={field.label}
          infoText={field.infoText}
          value={(value as string) || undefined}
          onUpload={(dataUri) => onChange(dataUri)}
        />
      );

    case "TOS_LINK":
      return (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <a
            href={(value as string) || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-yasmin hover:text-yasmin-dark underline"
          >
            {field.placeholder || "View Terms of Service"}
          </a>
        </div>
      );

    default:
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

// Searchable dropdown component for COUNTRY and DROPDOWN fields
function SearchableDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
  infoText,
  error,
}: {
  label: string;
  placeholder: string;
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (val: string) => void;
  infoText?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.key.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const selectedLabel = options.find((o) => o.key === value)?.label;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm text-left ${
            error ? "border-red-300" : "border-gray-200"
          }`}
        >
          <span className={selectedLabel ? "text-gray-900" : "text-gray-400"}>
            {selectedLabel || placeholder}
          </span>
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="sticky top-0 border-b border-gray-100 bg-white p-2">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none placeholder:text-gray-400"
                autoFocus
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-3 text-center text-sm text-gray-400">No results</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      onChange(opt.key);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                      value === opt.key
                        ? "bg-yasmin/10 font-medium text-yasmin-dark"
                        : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {infoText && !error && <p className="text-xs text-gray-500">{infoText}</p>}
    </div>
  );
}
