import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  createCandidateSchema,
  parseJson,
  parseSchema,
  validateJson,
  INPUT_LIMIT
} from './schema';
import { DEMO_HEADING, DEMO_INTRO } from './copy';
import { SAMPLES } from './samples';
import { sampleProvider, type AssistantResult } from './provider';

export default function JsonAssistantDemo() {
  const [input, setInput] = useState(JSON.stringify(SAMPLES[0].input, null, 2));
  const [schema, setSchema] = useState('');
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const reset = () => {
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setResult(null);
    setError('');
    setValidation(null);
    setConsent(false);
  };
  const editInput = (value: string) => {
    reset();
    setInput(value);
    setSchema('');
  };
  const explain = async (simulateError = false) => {
    if (!consent || busy) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const data = await sampleProvider.explain({
        input,
        signal: controller.signal,
        simulateError
      });
      if (!controller.signal.aborted) setResult(data);
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : 'The demo could not finish.'
        );
    } finally {
      if (request.current === controller) {
        setBusy(false);
        request.current = null;
      }
    }
  };
  const generate = () => {
    setError('');
    setValidation(null);
    try {
      setSchema(createCandidateSchema(input));
    } catch (reason) {
      setSchema('');
      setError((reason as Error).message);
    }
  };
  const validate = () => {
    setError('');
    setValidation(null);
    try {
      setValidation(validateJson(parseJson(input), parseSchema(schema)));
    } catch (reason) {
      setError((reason as Error).message);
    }
  };
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h3" fontWeight={800}>
            {DEMO_HEADING}
          </Typography>
          <Typography sx={{ mt: 2 }}>{DEMO_INTRO}</Typography>
        </Box>
        <Alert severity="info">
          Demo with authored sample results - not AI-generated. No Claude API,
          API key or paid inference is used. JSON entered here stays in this
          page&apos;s memory; the demo does not send it to a provider or save it
          to browser storage.
        </Alert>
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
          aria-label="Sample payloads"
        >
          {SAMPLES.map((sample) => (
            <Button
              key={sample.id}
              variant="outlined"
              onClick={() => editInput(JSON.stringify(sample.input, null, 2))}
            >
              Load {sample.label}
            </Button>
          ))}
          <Button onClick={() => editInput('')}>Clear input</Button>
        </Stack>
        <TextField
          label="JSON input"
          multiline
          minRows={9}
          maxRows={20}
          value={input}
          onChange={(event) => editInput(event.target.value)}
          helperText={`Local input limit: ${
            INPUT_LIMIT / 1024
          } KB. Use sample data; do not paste secrets.`}
          fullWidth
        />
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography component="h2" variant="h5">
              Sample explanation
            </Typography>
            <Typography>
              The examples illustrate a future assistant workflow. Explanations
              are written for the three sample payloads only; custom JSON is
              supported by the local schema tools below.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
              }
              label="I understand this runs locally with sample results, not Claude, and agree to process this input in the demo."
            />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                disabled={!consent || busy}
                onClick={() => void explain()}
              >
                {busy ? 'Preparing sample result…' : 'Show sample explanation'}
              </Button>
              <Button
                disabled={!consent || busy}
                onClick={() => void explain(true)}
              >
                Try demo error
              </Button>
            </Stack>
            {busy && (
              <Typography role="status">
                Preparing the local sample result…
              </Typography>
            )}
            {result && (
              <Box role="status">
                <Typography fontWeight={700}>
                  Authored sample result - not generated by Claude
                </Typography>
                <Typography sx={{ mt: 1 }}>{result.explanation}</Typography>
                <Typography sx={{ mt: 1 }}>{result.suggestion}</Typography>
              </Box>
            )}
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography component="h2" variant="h5">
              Local schema and validation
            </Typography>
            <Typography>
              Infer a candidate from your input, then edit and validate it. One
              sample cannot establish every valid shape. Supported subset: type,
              properties, required, additionalProperties, items and anyOf.
              Format, pattern, ranges and other keywords are rejected, not
              silently ignored.
            </Typography>
            <Button variant="outlined" onClick={generate}>
              Infer candidate schema locally
            </Button>
            <TextField
              label="Candidate schema"
              multiline
              minRows={8}
              maxRows={20}
              value={schema}
              onChange={(event) => {
                setSchema(event.target.value);
                setValidation(null);
                setError('');
              }}
              helperText="Schema limit: 64 KB. An empty schema accepts any JSON. Required fields and extra-property rules are inferred conservatively."
              fullWidth
            />
            <Button
              variant="contained"
              onClick={validate}
              disabled={!schema.trim()}
            >
              Validate JSON locally
            </Button>
            {validation && (
              <Alert severity={validation.length ? 'warning' : 'success'}>
                {validation.length ? (
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {validation.slice(0, 20).map((message, index) => (
                      <li key={index}>{message}</li>
                    ))}
                    {validation.length > 20 && (
                      <li>{validation.length - 20} more errors.</li>
                    )}
                  </Box>
                ) : (
                  'Input matches the supported structural rules. Business meaning and unsupported constraints are not validated.'
                )}
              </Alert>
            )}
          </Stack>
        </Paper>
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}
        <Typography variant="body2">
          No response here demonstrates a live Claude integration. A future
          connection will require separate consent for sending data, server-held
          credentials, rate limits and spending controls.
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <MuiLink component={Link} to="/regex-assistant">
            Regex Assistant demo
          </MuiLink>
          <MuiLink component={Link} to="/json/prettify">
            JSON formatter
          </MuiLink>
          <MuiLink component={Link} to="/json/validateJson">
            JSON validator
          </MuiLink>
          <MuiLink component={Link} to="/json/json-comparison">
            JSON comparison
          </MuiLink>
          <MuiLink component={Link} to="/privacy">
            Privacy policy
          </MuiLink>
        </Stack>
      </Stack>
    </Container>
  );
}
