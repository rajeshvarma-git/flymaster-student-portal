import { supabase } from '@/integrations/supabase/client';

export interface UniversityRecommendation {
  id: string;
  name: string;
  location: string;
  programs: string[];
  tuitionFee: string;
  duration: string;
  deadline: string;
  languageReq: string;
  postStudyVisa: string;
  ranking: string;
  website?: string;
}

const COUNTRY_ALIASES: Record<string, string> = {
  nepal: 'Nepal',
  usa: 'USA',
  us: 'USA',
  america: 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  uk: 'UK',
  britain: 'UK',
  england: 'UK',
  'united kingdom': 'UK',
  canada: 'Canada',
  australia: 'Australia',
  germany: 'Germany',
  ireland: 'Ireland',
  'new zealand': 'New Zealand',
  india: 'India',
  france: 'France',
  netherlands: 'Netherlands',
  holland: 'Netherlands',
};

export function normalizeCountry(input: string | undefined): string {
  const raw = (input || '').trim();
  if (!raw) return '';
  return COUNTRY_ALIASES[raw.toLowerCase()] || raw.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function inferStudyLevel(qualification: string | undefined): 'UG' | 'PG' {
  const text = (qualification || '').toLowerCase();
  if (/(12|twelfth|high school|\+2|plus two|intermediate|a[- ]?level|bachelor|b\.?tech|b\.?sc|undergraduate|ug\b)/.test(text)) {
    return 'UG';
  }
  return 'PG';
}

const COUNTRY_FALLBACKS: Record<string, { name: string; location: string; ranking: string; tuitionFee: string }[]> = {
  Nepal: [
    { name: 'Kathmandu University', location: 'Dhulikhel, Nepal', ranking: 'Leading private university in Nepal', tuitionFee: 'NPR 4–8 lakhs / year' },
    { name: 'Tribhuvan University — IOE Pulchowk', location: 'Lalitpur, Nepal', ranking: "Nepal's largest public university", tuitionFee: 'NPR 1–4 lakhs / year' },
    { name: 'Pokhara University', location: 'Pokhara, Nepal', ranking: 'Top regional university', tuitionFee: 'NPR 3–6 lakhs / year' },
  ],
  India: [
    { name: 'IIT Delhi', location: 'New Delhi, India', ranking: 'Top engineering institute', tuitionFee: 'INR 2–3 lakhs / year' },
    { name: 'IISc Bangalore', location: 'Bengaluru, India', ranking: 'Top research university', tuitionFee: 'INR 1–2 lakhs / year' },
    { name: 'Delhi University', location: 'New Delhi, India', ranking: 'Leading public university', tuitionFee: 'INR 50,000–1.5 lakhs / year' },
  ],
  USA: [
    { name: 'University of California, Berkeley', location: 'Berkeley, California, USA', ranking: 'Ranked #4 globally', tuitionFee: '$45,000 - $55,000' },
    { name: 'Stanford University', location: 'Stanford, California, USA', ranking: 'Ranked #3 globally', tuitionFee: '$52,000 - $58,000' },
    { name: 'University of Illinois Urbana-Champaign', location: 'Urbana, Illinois, USA', ranking: 'Top public CS program', tuitionFee: '$35,000 - $48,000' },
  ],
  UK: [
    { name: 'University of Manchester', location: 'Manchester, England, UK', ranking: 'Russell Group', tuitionFee: '£28,000 - £38,000' },
    { name: 'University of Edinburgh', location: 'Edinburgh, Scotland, UK', ranking: 'Ranked #15 globally', tuitionFee: '£28,000 - £38,000' },
    { name: 'University of Glasgow', location: 'Glasgow, Scotland, UK', ranking: 'Russell Group', tuitionFee: '£26,000 - £35,000' },
  ],
  Canada: [
    { name: 'University of Toronto', location: 'Toronto, Ontario, Canada', ranking: 'Ranked #18 globally', tuitionFee: 'CAD $45,000 - $55,000' },
    { name: 'University of British Columbia', location: 'Vancouver, BC, Canada', ranking: 'Ranked #34 globally', tuitionFee: 'CAD $40,000 - $50,000' },
    { name: 'McGill University', location: 'Montreal, Quebec, Canada', ranking: 'Ranked #27 globally', tuitionFee: 'CAD $35,000 - $45,000' },
  ],
  Australia: [
    { name: 'University of Melbourne', location: 'Melbourne, Australia', ranking: 'Group of Eight', tuitionFee: 'AUD $40,000 - $50,000' },
    { name: 'University of Sydney', location: 'Sydney, Australia', ranking: 'Group of Eight', tuitionFee: 'AUD $42,000 - $52,000' },
    { name: 'Monash University', location: 'Melbourne, Australia', ranking: 'Group of Eight', tuitionFee: 'AUD $38,000 - $48,000' },
  ],
  Germany: [
    { name: 'Technical University of Munich', location: 'Munich, Germany', ranking: 'Top technical university', tuitionFee: 'Low / semester fee' },
    { name: 'RWTH Aachen', location: 'Aachen, Germany', ranking: 'Leading engineering school', tuitionFee: 'Low / semester fee' },
    { name: 'Heidelberg University', location: 'Heidelberg, Germany', ranking: 'Oldest university in Germany', tuitionFee: 'Low / semester fee' },
  ],
};

function programTitle(level: 'UG' | 'PG', stream: string) {
  const field = (stream || 'your chosen field').trim();
  return level === 'UG' ? `Bachelor in ${field}` : `Master in ${field}`;
}

function visaInfo(country: string) {
  const map: Record<string, string> = {
    Nepal: 'Study in Nepal — no overseas student visa required for Nepali citizens',
    USA: '12 months OPT + 24 months STEM extension',
    UK: '2 years Graduate visa',
    Canada: '3 years Post-graduation work permit',
    Australia: '2-4 years Temporary Graduate visa',
    Germany: '18 months job search visa',
    India: 'Domestic study — no student visa for Indian citizens',
  };
  return map[country] || 'Check local student visa rules for this destination';
}

export function matchesCountry(universityCountry: string, wanted: string) {
  const a = universityCountry.toLowerCase();
  const b = wanted.toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

export function matchesAnyCountry(universityCountry: string, wanted: string[]) {
  return wanted.some((item) => matchesCountry(universityCountry, normalizeCountry(item)));
}

export function getFallbackUniversities(countries: string[]) {
  const seen = new Set<string>();
  const results: {
    id: string;
    name: string;
    country: string;
    city: string | null;
    website_url: string | null;
    ranking: number | null;
    is_active: boolean;
    university_type: string | null;
    description: string;
    isFallback: true;
  }[] = [];

  for (const raw of countries) {
    const country = normalizeCountry(raw);
    for (const uni of COUNTRY_FALLBACKS[country] || []) {
      if (seen.has(uni.name)) continue;
      seen.add(uni.name);
      const [city] = uni.location.split(',').map((part) => part.trim());
      results.push({
        id: `fallback-${country}-${uni.name}`,
        name: uni.name,
        country,
        city: city || country,
        website_url: null,
        ranking: null,
        is_active: true,
        university_type: 'recommended',
        description: `${uni.ranking}. Typical fees: ${uni.tuitionFee}.`,
        isFallback: true,
      });
    }
  }

  return results;
}

export async function getRecommendationsForProfile(conversationData: Record<string, any>): Promise<UniversityRecommendation[]> {
  const country = normalizeCountry(conversationData.country);
  const level = inferStudyLevel(conversationData.qualification);
  const stream = conversationData.streamOrProgram || 'your chosen field';

  const { data: rows } = await supabase
    .from('universities')
    .select('*')
    .eq('is_active', true);

  const matched = (rows || []).filter((row) => matchesCountry(row.country, country));

  if (matched.length > 0) {
    return matched.slice(0, 6).map((uni) => ({
      id: uni.id,
      name: uni.name,
      location: [uni.city, uni.country].filter(Boolean).join(', '),
      programs: [programTitle(level, stream)],
      tuitionFee: 'Contact for fees',
      duration: level === 'UG' ? '3-4 years' : '1-2 years',
      deadline: 'Rolling admissions',
      languageReq: country === 'Nepal' || country === 'India' ? 'English or local language as required' : 'IELTS 6.5+ or TOEFL 80+',
      postStudyVisa: visaInfo(country),
      ranking: uni.ranking ? `Ranked #${uni.ranking}` : 'Partner university',
      website: uni.website_url || undefined,
    }));
  }

  const fallback = COUNTRY_FALLBACKS[country];
  if (fallback) {
    return fallback.map((uni, index) => ({
      id: `local-${country}-${index}`,
      name: uni.name,
      location: uni.location,
      programs: [programTitle(level, stream), `Applied ${stream}`],
      tuitionFee: uni.tuitionFee,
      duration: level === 'UG' ? '3-4 years' : '1-2 years',
      deadline: 'Check university intake dates',
      languageReq: country === 'Nepal' || country === 'India' ? 'English or local language as required' : 'IELTS 6.5+ or TOEFL 80+',
      postStudyVisa: visaInfo(country),
      ranking: uni.ranking,
      website: undefined,
    }));
  }

  return [
    {
      id: 'generic-1',
      name: `Top universities in ${country || 'your chosen country'}`,
      location: country || 'Selected destination',
      programs: [programTitle(level, stream)],
      tuitionFee: 'Varies by university',
      duration: level === 'UG' ? '3-4 years' : '1-2 years',
      deadline: 'A counselor will confirm intakes',
      languageReq: 'Depends on the university',
      postStudyVisa: visaInfo(country),
      ranking: 'Matched to your destination',
      website: undefined,
    },
  ];
}
