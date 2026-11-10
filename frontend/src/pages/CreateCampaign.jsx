import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ImageIcon,
  Info,
  Minus,
  Plus,
  UploadCloud,
  Video,
  X
} from 'lucide-react';

import { api, uploadFile, useApi } from '../api.js';
import { useApp } from '../context.js';
import {
  formatDate,
  formatTime,
  fullNumber,
  inr,
  todayLocal
} from '../utils/format.js';

const AD_DURATIONS = [10, 15, 20, 30];

const MB = 1024 * 1024;

const FORMATS = {
  jpg: { type: 'image', max: 5 * MB },
  jpeg: { type: 'image', max: 5 * MB },
  png: { type: 'image', max: 5 * MB },
  webp: { type: 'image', max: 5 * MB },
  mp4: { type: 'video', max: 50 * MB },
  webm: { type: 'video', max: 50 * MB },
  mov: { type: 'video', max: 50 * MB },
};

const KINDS = {
  image: {
    label: 'Image',
    Icon: ImageIcon,
    formats: 'JPG, PNG, WEBP',
    limit: '5 MB'
  },
  video: {
    label: 'Video',
    Icon: Video,
    formats: 'MP4, WEBM, MOV',
    limit: '50 MB'
  },
};

const acceptFor = (kind) =>
  Object.keys(FORMATS)
    .filter((e) => FORMATS[e].type === kind)
    .map((e) => `.${e}`)
    .join(',');

function checkFile(file, kind) {
  const ext = file.name.split('.').pop().toLowerCase();
  const rule = FORMATS[ext];

  if (!rule || rule.type !== kind) {
    return `Choose a ${KINDS[kind].label.toLowerCase()} file (${KINDS[kind].formats}).`;
  }

  if (file.size > rule.max) {
    return `${rule.type === 'image' ? 'Images' : 'Videos'} must be ${rule.max / MB} MB or smaller.`;
  }

  return '';
}

const plural = (n, word) =>
  `${n} ${word}${n === 1 ? '' : 's'}`;

// Operating hours validation
function describeSchedule({
  startDate,
  endDate,
  startTime,
  endTime
}) {
  if (!startDate || !endDate || !startTime || !endTime) {
    return {
      text: 'Choose dates and times to see the duration.'
    };
  }

  if (endDate < startDate) {
    return {
      error: 'The end date must be on or after the start date.'
    };
  }

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  // Overnight timings are not allowed
  if (endMinutes <= startMinutes) {
    return {
      error: 'End time must be later than start time. Overnight timings are not allowed.'
    };
  }

  const days =
    Math.round(
      (Date.parse(endDate) - Date.parse(startDate)) / 86400000
    ) + 1;

  const hours =
    Math.round(((endMinutes - startMinutes) / 60) * 10) / 10;

  return {
    days,
    text: `${plural(days, 'day')}, ${hours} ${hours === 1 ? 'hour' : 'hours'} a day (${formatTime(startTime)} to ${formatTime(endTime)})`
  };
}

function Section({ title, hint, children }) {
  return (
    <fieldset className="space-y-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
      <div>
        <legend className="text-base font-bold">{title}</legend>
        {hint && (
          <p className="text-sm text-slate-500">{hint}</p>
        )}
      </div>

      {children}
    </fieldset>
  );
}

export default function CreateCampaign() {
  const { navigate, notify } = useApp();

  const { data: locations } = useApi('/locations');

  const today = todayLocal();

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    startDate: today,
    endDate: today,
    startTime: '09:00',
    endTime: '21:00',
    adDuration: 15,
    frequency: 6,
    budget: ''
  });

  const [locationSearch, setLocationSearch] = useState('');

  const [autos, setAutos] = useState(1);
  const [avail, setAvail] = useState(null);
  const [step, setStep] = useState(1);
  const [mediaKind, setMediaKind] = useState('image');
  const [est, setEst] = useState(null);
  const [media, setMedia] = useState(null);
  const [upload, setUpload] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fileRef = useRef(null);

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.value
    }));

  const schedule = describeSchedule(form);

  const datesOk =
    form.startDate >= today &&
    form.endDate >= form.startDate;

  const locationList = Array.isArray(locations)
    ? locations
    : [];

  const filteredLocations = locationList.filter((location) =>
    String(location.name || '')
      .toLowerCase()
      .includes(locationSearch.trim().toLowerCase())
  );

  // Check location availability
  useEffect(() => {
    if (!form.location || !datesOk) {
      setAvail(null);
      return undefined;
    }

    let alive = true;

    setAvail({ loading: true });

    api(
      `/locations/${form.location}/availability?startDate=${form.startDate}&endDate=${form.endDate}`
    )
      .then((data) => {
        if (!alive) return;

        setAvail({ data });

        setAutos((a) =>
          data.available === 0
            ? 0
            : Math.min(Math.max(a || 1, 1), data.available)
        );
      })
      .catch((e) => {
        if (alive) {
          setAvail({ error: e.message });
        }
      });

    return () => {
      alive = false;
    };
  }, [
    form.location,
    form.startDate,
    form.endDate,
    datesOk
  ]);

  useEffect(
    () => () => media?.preview && URL.revokeObjectURL(media.preview),
    [media]
  );

  const available = avail?.data?.available ?? 0;

  // Upload creative
  const handleFile = async (file) => {
    if (!file) return;

    setUploadError('');

    const problem = checkFile(file, mediaKind);

    if (problem) {
      return setUploadError(problem);
    }

    setUpload({
      name: file.name,
      pct: 0
    });

    try {
      const res = await uploadFile(file, (pct) =>
        setUpload({
          name: file.name,
          pct
        })
      );

      if (media) {
        api(
          `/uploads/${media.url.split('/').pop()}`,
          { method: 'DELETE' }
        ).catch(() => {});
      }

      setMedia({
        ...res,
        preview: URL.createObjectURL(file)
      });
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUpload(null);
    }
  };

  const removeMedia = () => {
    if (media) {
      api(
        `/uploads/${media.url.split('/').pop()}`,
        { method: 'DELETE' }
      ).catch(() => {});
    }

    setMedia(null);

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const chooseKind = (kind) => {
    if (kind === mediaKind) return;

    if (media) removeMedia();

    setUploadError('');
    setMediaKind(kind);
  };

  // Estimated campaign reach
  useEffect(() => {
    if (!autos || !datesOk || schedule.error) {
      setEst(null);
      return undefined;
    }

    let alive = true;

    const q =
      `autos=${autos}&frequency=${form.frequency}` +
      `&startDate=${form.startDate}` +
      `&endDate=${form.endDate}` +
      `&startTime=${form.startTime}` +
      `&endTime=${form.endTime}`;

    api(`/campaigns/estimate?${q}`)
      .then((data) => {
        if (alive) setEst({ data });
      })
      .catch((e) => {
        if (alive) setEst({ error: e.message });
      });

    return () => {
      alive = false;
    };
  }, [
    autos,
    datesOk,
    schedule.error,
    form.frequency,
    form.startDate,
    form.endDate,
    form.startTime,
    form.endTime
  ]);

  const budgetNum = Number(
    String(form.budget).replace(/\D/g, '')
  );

  // Continue to review
  const goToReview = (e) => {
    e.preventDefault();

    setError('');

    if (!form.name.trim()) {
      return setError('Enter a campaign name.');
    }

    if (!form.location) {
      return setError('Choose a target location.');
    }

    if (!datesOk) {
      return setError('Choose valid campaign dates.');
    }

    if (schedule.error) {
      return setError(schedule.error);
    }

    if (!budgetNum) {
      return setError('Enter your campaign budget.');
    }

    if (!avail?.data || available < 1 || autos < 1) {
      return setError('Choose a location with available autos.');
    }

    if (!media) {
      return setError(`Upload your ${mediaKind} creative.`);
    }

    setStep(2);

    window.scrollTo({ top: 0 });
  };

  // Submit campaign
  const submit = async (e) => {
    e.preventDefault();

    setError('');
    setBusy(true);

    try {
      const c = await api('/campaigns', {
        method: 'POST',
        body: {
          ...form,
          autos,
          budget: budgetNum,
          adDuration: Number(form.adDuration),
          frequency: Number(form.frequency),
          mediaUrl: media?.url,
          mediaName: media?.name
        }
      });

      notify(`${c.name} was submitted for admin approval.`);
      navigate('campaigns');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const canContinue =
    !upload &&
    media &&
    avail?.data &&
    available > 0 &&
    autos >= 1 &&
    !schedule.error &&
    datesOk &&
    budgetNum > 0 &&
    form.name.trim() &&
    form.location;

  return (
    <div className="mx-auto max-w-3xl space-y-5">

      <h1 className="text-2xl font-extrabold">
        Create Campaign
      </h1>

      <ol
        className="flex items-center gap-3 text-sm font-semibold"
        aria-label="Progress"
      >
        <li className={`flex items-center gap-2 ${step === 1 ? 'text-brand-700' : 'text-slate-500'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === 1 ? 'bg-brand-600 text-white' : 'bg-emerald-500 text-white'}`}>
            {step === 1 ? 1 : <CheckCircle2 size={14} />}
          </span>
          Campaign details
        </li>

        <li aria-hidden="true" className="h-px w-8 bg-slate-300" />

        <li className={`flex items-center gap-2 ${step === 2 ? 'text-brand-700' : 'text-slate-500'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            2
          </span>
          Review and submit
        </li>
      </ol>

      {step === 1 && (
        <form
          onSubmit={goToReview}
          className="card space-y-6 p-6"
        >

          <Section title="Campaign details">

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="label" htmlFor="cname">
                  Campaign name
                </label>

                <input
                  id="cname"
                  className="input"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Diwali Offer"
                  maxLength={80}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label" htmlFor="cdesc">
                  Description (optional)
                </label>

                <textarea
                  id="cdesc"
                  rows={2}
                  className="input"
                  value={form.description}
                  onChange={set('description')}
                  maxLength={500}
                />
              </div>

            </div>
          </Section>

          {/* DURATION AND OPERATING HOURS */}

          <Section
            title="Duration and operating hours"
            hint="Your ad plays between the start and end time on each day. Overnight timings are not allowed."
          >

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="label" htmlFor="sdate">
                  Start date
                </label>

                <input
                  id="sdate"
                  type="date"
                  className="input"
                  min={today}
                  value={form.startDate}
                  onChange={set('startDate')}
                />
              </div>

              <div>
                <label className="label" htmlFor="edate">
                  End date
                </label>

                <input
                  id="edate"
                  type="date"
                  className="input"
                  min={form.startDate || today}
                  value={form.endDate}
                  onChange={set('endDate')}
                />
              </div>

              <div>
                <label className="label" htmlFor="stime">
                  Operating hours: from
                </label>

                <input
                  id="stime"
                  type="time"
                  className="input"
                  value={form.startTime}
                  onChange={set('startTime')}
                />
              </div>

              <div>
                <label className="label" htmlFor="etime">
                  Operating hours: until
                </label>

                <input
                  id="etime"
                  type="time"
                  className="input"
                  value={form.endTime}
                  onChange={set('endTime')}
                />
              </div>

            </div>

            <div>
              <p className="label">Campaign duration</p>

              <div
                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                  schedule.error
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-slate-50'
                }`}
                aria-live="polite"
              >
                {schedule.error || schedule.text}
              </div>
            </div>

          </Section>

          {/* LOCATION SELECTION */}

          <Section
            title="Geographic targeting and number of autos"
            hint="Search and select a location. Availability is shown for the location and dates you choose."
          >

            <div className="space-y-3">

              <div>
                <label
                  className="label"
                  htmlFor="location-search"
                >
                  Search locations
                </label>

                <input
                  id="location-search"
                  type="search"
                  className="input"
                  placeholder="Type a location name..."
                  value={locationSearch}
                  onChange={(e) =>
                    setLocationSearch(e.target.value)
                  }
                />
              </div>

              {filteredLocations.length > 0 ? (

                <div className="grid gap-3 sm:grid-cols-2">

                  {filteredLocations.map((location) => {

                    const selected =
                      String(form.location) ===
                      String(location.id);

                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            location: String(location.id)
                          }));

                          setError('');
                        }}
                        aria-pressed={selected}
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                            : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'
                        }`}
                      >

                        <span className="flex items-center justify-between gap-2">

                          <span className="font-bold text-slate-900">
                            {location.name}
                          </span>

                          {selected && (
                            <CheckCircle2
                              size={18}
                              className="shrink-0 text-brand-600"
                            />
                          )}

                        </span>

                        {location.address && (
                          <span className="mt-1 block text-xs text-slate-500">
                            {location.address}
                          </span>
                        )}

                        <span className={`mt-2 inline-block text-xs font-semibold ${
                          selected
                            ? 'text-brand-700'
                            : 'text-slate-500'
                        }`}>
                          {selected
                            ? 'Selected location'
                            : 'Select this location'}
                        </span>

                      </button>
                    );
                  })}

                </div>

              ) : (

                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  {locationList.length
                    ? 'No locations match your search.'
                    : 'No locations are currently available.'}
                </p>

              )}

            </div>

            {!datesOk && form.location && (
              <p className="text-sm font-medium text-red-600">
                Fix the dates above to check availability.
              </p>
            )}

            {avail?.loading && (
              <p className="text-sm text-slate-500">
                Checking availability...
              </p>
            )}

            {avail?.error && (
              <p className="text-sm font-medium text-red-600">
                {avail.error}
              </p>
            )}

            {/* AVAILABILITY DETAILS */}

            {avail?.data && (

              <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">

                <p className="text-sm text-slate-600">
                  {avail.data.name},{' '}
                  {formatDate(avail.data.startDate)} to{' '}
                  {formatDate(avail.data.endDate)}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">

                  <div className="rounded-lg bg-white p-3">
                    <p className="text-xl font-extrabold text-emerald-700">
                      {avail.data.available}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Available
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-3">
                    <p className="text-xl font-extrabold text-slate-700">
                      {avail.data.booked}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Booked
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-3">
                    <p className="text-xl font-extrabold text-slate-700">
                      {avail.data.total}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Total autos
                    </p>
                  </div>

                </div>

                {avail.data.available === 0 ? (

                  <p className="mt-3 text-sm font-semibold text-red-600">
                    No autos are free here for these dates. Try another location or different dates.
                  </p>

                ) : (

                  <div className="mt-4">

                    <p className="label">
                      Autos to book
                    </p>

                    <div className="flex items-center gap-3">

                      <button
                        type="button"
                        aria-label="Book one fewer auto"
                        className="btn-ghost !p-2"
                        disabled={autos <= 1}
                        onClick={() =>
                          setAutos((a) => Math.max(1, a - 1))
                        }
                      >
                        <Minus size={16} />
                      </button>

                      <input
                        type="number"
                        aria-label="Number of autos to book"
                        min={1}
                        max={available}
                        value={autos}
                        onChange={(e) =>
                          setAutos(
                            Math.min(
                              available,
                              Math.max(
                                1,
                                Math.floor(Number(e.target.value)) || 1
                              )
                            )
                          )
                        }
                        className="input w-20 text-center font-bold"
                      />

                      <button
                        type="button"
                        aria-label="Book one more auto"
                        className="btn-ghost !p-2"
                        disabled={autos >= available}
                        onClick={() =>
                          setAutos((a) =>
                            Math.min(available, a + 1)
                          )
                        }
                      >
                        <Plus size={16} />
                      </button>

                      <span className="text-sm text-slate-500">
                        of {available} available
                      </span>

                    </div>
                  </div>

                )}

              </div>

            )}

          </Section>

          {/* ADVERTISEMENT SETTINGS */}

          <Section
            title="Advertisement settings"
            hint="How long each ad runs, how often it plays and what you want to spend."
          >

            <div className="grid gap-4 sm:grid-cols-3">

              <div>
                <label className="label" htmlFor="adur">
                  Advertisement duration
                </label>

                <select
                  id="adur"
                  className="input"
                  value={form.adDuration}
                  onChange={set('adDuration')}
                >
                  {AD_DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} seconds
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="freq">
                  Playback frequency
                </label>

                <input
                  id="freq"
                  type="number"
                  min={1}
                  max={60}
                  className="input"
                  value={form.frequency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      frequency: Math.min(
                        60,
                        Math.max(
                          1,
                          Math.floor(Number(e.target.value)) || 1
                        )
                      )
                    }))
                  }
                />

                <p className="mt-1 text-xs text-slate-500">
                  Plays per hour on each auto
                </p>
              </div>

              <div>
                <label className="label" htmlFor="budget">
                  Campaign budget
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                    ₹
                  </span>

                  <input
                    id="budget"
                    inputMode="numeric"
                    autoComplete="off"
                    className="input pl-7"
                    value={
                      budgetNum
                        ? budgetNum.toLocaleString('en-IN')
                        : ''
                    }
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        budget: e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 9)
                      }))
                    }
                  />

                </div>
              </div>

            </div>

            <div
              className="rounded-xl border border-amber-200 bg-amber-50 p-4"
              aria-live="polite"
            >

              <p className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
                <Info size={16} />
                Estimated campaign reach
              </p>

              {est?.data ? (

                <>
                  <p className="mt-1 text-2xl font-extrabold text-amber-900">
                    {fullNumber(est.data.estimatedPlaybacks)}{' '}
                    <span className="text-base font-semibold">
                      scheduled playbacks
                    </span>
                  </p>

                  <p className="text-xs text-amber-800">
                    {plural(autos, 'auto')} x{' '}
                    {plural(est.data.days, 'day')} x{' '}
                    {est.data.hoursPerDay} hours x{' '}
                    {form.frequency} plays per hour.
                  </p>
                </>

              ) : (

                <p className="mt-1 text-sm text-amber-800">
                  {est?.error ||
                    'Choose a location, dates and autos to see the estimate.'}
                </p>

              )}

              <p className="mt-2 text-xs text-amber-800">
                This is an estimate only. It is not verified playback and does not show how many people will see your ad.
              </p>

            </div>

          </Section>

          {/* CAMPAIGN CREATIVE */}

          <Section
            title="Campaign creative"
            hint="Choose whether your ad is an image or a video, then upload the file."
          >

            <div
              role="radiogroup"
              aria-label="Creative type"
              className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
            >

              {Object.entries(KINDS).map(([kind, { label, Icon }]) => (

                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={mediaKind === kind}
                  disabled={Boolean(upload)}
                  onClick={() => chooseKind(kind)}
                  className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60 ${
                    mediaKind === kind
                      ? 'bg-white text-brand-700 shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>

              ))}

            </div>

            <p className="text-xs font-semibold text-slate-500">
              {KINDS[mediaKind].formats} (max {KINDS[mediaKind].limit})
            </p>

            {!media && (

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                  dragging
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-300'
                }`}
              >

                <UploadCloud
                  size={32}
                  className="mb-2 text-brand-600"
                />

                <p className="text-sm font-semibold">
                  Drag your {mediaKind} here or
                </p>

                <button
                  type="button"
                  className="btn-soft mt-2"
                  disabled={Boolean(upload)}
                  onClick={() => fileRef.current?.click()}
                >
                  Choose {mediaKind}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept={acceptFor(mediaKind)}
                  className="sr-only"
                  aria-label={`Upload ${mediaKind}`}
                  onChange={(e) =>
                    handleFile(e.target.files?.[0])
                  }
                />

                {upload && (

                  <div
                    className="mt-4 w-full max-w-xs"
                    role="status"
                  >

                    <p className="mb-1 truncate text-xs font-semibold text-slate-600">
                      Uploading {upload.name} ({upload.pct}%)
                    </p>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-brand-600 transition-all"
                        style={{
                          width: `${upload.pct}%`
                        }}
                      />
                    </div>

                  </div>

                )}

              </div>

            )}

            {media && (

              <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-3">

                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">

                  {media.type === 'video' ? (

                    <video
                      src={media.preview}
                      muted
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <img
                      src={media.preview}
                      alt="Campaign creative preview"
                      className="h-full w-full object-cover"
                    />

                  )}

                </div>

                <div className="min-w-0 flex-1">

                  <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-emerald-600"
                    />
                    <span className="truncate">
                      {media.name}
                    </span>
                  </p>

                  <p className="text-xs text-slate-500">
                    {media.type === 'video' ? 'Video' : 'Image'} •{' '}
                    {(media.size / MB).toFixed(1)} MB
                  </p>

                </div>

                <button
                  type="button"
                  onClick={removeMedia}
                  className="btn-ghost !px-3 !py-1.5"
                >
                  <X size={14} />
                  Remove
                </button>

              </div>

            )}

            {uploadError && (
              <p
                role="alert"
                className="text-sm font-medium text-red-600"
              >
                {uploadError}
              </p>
            )}

          </Section>

          {canContinue && (

            <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
              You&apos;re booking{' '}
              <strong>{plural(autos, 'auto')}</strong> in{' '}
              <strong>{avail.data.name}</strong> for{' '}
              <strong>{schedule.text}</strong>.
            </p>

          )}

          {error && (
            <p
              role="alert"
              className="text-sm font-medium text-red-600"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">

            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate('campaigns')}
            >
              Cancel
            </button>

            <button
              className="btn-primary"
              disabled={!canContinue}
            >
              Review campaign
            </button>

          </div>

          {!canContinue && (
            <p className="-mt-3 text-right text-xs text-slate-500">
              To continue: name your campaign, choose a location with free autos, enter a budget and upload your {mediaKind}.
            </p>
          )}

        </form>
      )}

      {/* REVIEW AND SUBMIT */}

      {step === 2 && (

        <form
          onSubmit={submit}
          className="space-y-5"
        >

          <section className="card space-y-3 p-6">

            <h2 className="text-base font-bold">
              Review your campaign
            </h2>

            <dl className="text-sm">

              {[
                ['Campaign', form.name],
                ['Description', form.description || '-'],
                [
                  'Dates',
                  `${formatDate(form.startDate)} - ${formatDate(form.endDate)}`
                ],
                [
                  'Operating hours',
                  `${formatTime(form.startTime)} - ${formatTime(form.endTime)}`
                ],
                ['Target location', avail?.data?.name],
                ['Number of autos', String(autos)],
                [
                  'Advertisement duration',
                  `${form.adDuration} seconds`
                ],
                [
                  'Playback frequency',
                  `${form.frequency} per hour per auto`
                ],
                ['Campaign budget', inr(budgetNum)],
                [
                  'Creative',
                  media ? `${media.name} (${media.type})` : '-'
                ],
              ].map(([k, v]) => (

                <div
                  key={k}
                  className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0"
                >
                  <dt className="text-slate-500">
                    {k}
                  </dt>

                  <dd className="text-right font-semibold">
                    {v}
                  </dd>
                </div>

              ))}

            </dl>

            {est?.data && (

              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Estimated reach:{' '}
                <strong>
                  {fullNumber(est.data.estimatedPlaybacks)} scheduled playbacks
                </strong>{' '}
                (an estimate, not verified playback or audience exposure).
              </p>

            )}

          </section>

          <section className="card space-y-3 p-6">

            <h2 className="text-base font-bold">
              What happens next
            </h2>

            <p className="text-sm text-slate-600">
              Submitting sends your campaign to an admin for approval. Nothing is charged now. Once approved, the campaign is scheduled and an invoice appears under Invoices & Payments. You can follow every step on My Campaigns.
            </p>

            {error && (
              <p
                role="alert"
                className="text-sm font-medium text-red-600"
              >
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">

              <button
                type="button"
                className="btn-ghost"
                disabled={busy}
                onClick={() => {
                  setError('');
                  setStep(1);
                }}
              >
                Back
              </button>

              <button
                className="btn-primary"
                disabled={busy}
              >
                {busy ? 'Submitting...' : 'Submit for approval'}
              </button>

            </div>

          </section>

        </form>

      )}

    </div>
  );
}
