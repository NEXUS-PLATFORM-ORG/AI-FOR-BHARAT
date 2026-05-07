# Document Extraction Pipeline Architecture

## Overview

This document extraction pipeline is designed to process large legal documents (500+ page PDFs) on CPU-only hardware using local models. The core challenge is intelligent token reduction - getting from 400K tokens down to 2-5K tokens that contain the actual fields of interest before any LLM processing.

## System Constraints & Design Decisions

- **Hardware**: CPU-only local machine (no GPU)
- **Model**: Qwen2.5-7B via Ollama (32K context window)
- **Target**: 500-page judgment PDFs (~250K-400K tokens)
- **Key Insight**: 97% token reduction through intelligent preprocessing before LLM sees any content

## Architecture Stages

### Stage 1: Ingest
**Purpose**: File validation and tamper evidence
**Input**: PDF file path
**Output**: IngestResult with metadata

```
Components:
- SHA-256 hash calculation (tamper evidence)
- Page count extraction
- File size validation
- Readability check
```

**Key Features**:
- Tamper evidence starts immediately with SHA-256
- Early failure detection for corrupted files
- Metadata collection for audit trail

### Stage 2: Classify & Route
**Purpose**: Per-page classification to determine processing pipeline
**Input**: PDF file
**Output**: List of PageClassification objects

```
Classification Logic:
- Pipeline A: Digital pages (>50 chars/page, clean text layer)
- Pipeline B: Scanned pages (<50 chars/page OR corrupt text layer)
- Two-column detection for layout-aware extraction
- Corrupt text detection (replacement character ratio)
```

**Key Innovation**: Page-level classification instead of document-level - handles mixed digital/scanned documents.

### Stage 3: Text Extraction (Dual Pipeline)

#### Pipeline A: Digital Text Extraction
**For**: Clean digital pages
**Technology**: PyMuPDF
**Features**:
- Two-column layout detection and handling
- Span collection with positional metadata
- Font size and formatting preservation
- Fallback to Pipeline B for corrupt text

#### Pipeline B: OCR Text Extraction  
**For**: Scanned pages or corrupt digital text
**Technology**: OpenCV + Tesseract
**Features**:
- 300 DPI rendering
- Image preprocessing (deskew, denoise, binarize)
- Confidence scoring (DQS - Document Quality Score)
- Word-level confidence filtering

### Stage 4: Deterministic NLP Pre-extraction
**Purpose**: Extract pattern-matchable fields before LLM processing
**Technology**: Regex + spaCy NER
**Target**: Zero hallucination extraction

```
Extracted Fields:
- Case numbers (W.P. No. patterns)
- Neutral citations (YYYY:KHC patterns)
- Connected cases
- Statute citations
- Judge names (from headers)
- Relief granted (from operative portions)
- Named entities (PERSON, ORG, GPE/LOC)
```

**Performance**: Runs on first 50K chars only for NER (sufficient for entity extraction).

### Stage 5: Section Detection & Intelligent Chunking
**Purpose**: The critical stage - identify document sections and send only relevant parts to LLM
**Input**: Full document text
**Output**: Structured sections with token estimates

```
Section Types:
- Header: Court identification, case details
- Facts: Background and procedural history  
- Analysis: Legal reasoning and precedents
- Operative: Court orders and directions
- Signature: Judge signatures and dates
```

**Chunking Strategy**:
- Priority-based section selection
- Token budget management (6K tokens per LLM call)
- Truncation with head/tail preservation for oversized sections
- 97% token reduction achieved here

### Stage 6: LLM Extraction
**Purpose**: Extract fields requiring language understanding
**Technology**: Ollama with Qwen2.5:7b
**Strategy**: One specialized prompt per section type

#### Operative Section Prompt
Extracts:
- Directives with timelines and responsible departments
- Next hearing dates
- Limitation periods
- Relief granted classification
- Named officers
- Cost orders
- Interim orders

#### Facts Section Prompt  
Extracts:
- Subject matter classification
- Geographical scope
- Prior proceedings
- Contempt history

#### Analysis Section Prompt
Extracts:
- Statutes cited (including both CrPC and BNSS)
- Precedents with relevance
- Order type classification

**LLM Configuration**:
- Temperature: 0.0 (deterministic extraction)
- Context: 8192 tokens
- JSON-only responses
- Error handling with regex fallback

### Stage 7: Merge, Validate & Emit
**Purpose**: Combine all extraction results into structured output
**Technology**: Pydantic models for validation

```
Output Structure:
- Deterministic fields (from NLP stage)
- LLM-extracted fields (from section-specific prompts)
- Pipeline metadata and audit trail
- Confidence scores per field
- Chain hash for tamper detection
```

**Validation Features**:
- Type checking via Pydantic
- Deduplication across extraction methods
- Confidence scoring
- Audit trail with extraction SHA-256

## Data Flow

```
PDF Input (500 pages, ~400K tokens)
    ↓
[Stage 1] Ingest & Validate
    ↓
[Stage 2] Page Classification (A/B routing)
    ↓
[Stage 3] Text Extraction (dual pipeline)
    ↓
[Stage 4] NLP Pre-extraction (regex + spaCy)
    ↓
[Stage 5] Section Detection (~12K tokens selected)
    ↓
[Stage 6] LLM Extraction (3 focused prompts, ~4K tokens each)
    ↓
[Stage 7] Merge & Validate
    ↓
Structured JSON Output
```

## Performance Characteristics

| Stage | Input | Output | LLM Tokens |
|-------|-------|--------|------------|
| Full Document | 500 pages | ~350K tokens | - |
| After Section Detection | - | Operative: ~3K, Facts: ~5K, Analysis: ~4K | ~12K total |
| LLM Processing | - | 3 focused prompts | ~4K each |

**Total Reduction**: 97% token reduction before LLM processing

## Technology Stack

### Core Dependencies
- **PyMuPDF**: Digital PDF text extraction
- **OpenCV**: Image preprocessing for OCR
- **Tesseract**: OCR engine
- **spaCy**: Named entity recognition
- **Pydantic**: Data validation and serialization
- **Ollama**: Local LLM inference

### Model Requirements
- **Qwen2.5:7b**: 7B parameter model via Ollama
- **en_core_web_lg**: spaCy English model for NER
- **CPU-only**: No GPU dependencies

## Scalability Considerations

### Memory Management
- Page-by-page processing to avoid loading entire document
- Streaming text extraction
- Section-based chunking prevents memory overflow

### Performance Optimization
- Early classification prevents unnecessary OCR
- Deterministic extraction reduces LLM calls
- Section detection minimizes LLM input size
- Parallel processing opportunities in classification stage

### Error Handling
- Graceful degradation (Pipeline A → Pipeline B fallback)
- Confidence scoring for quality assessment
- JSON parsing with regex fallback
- Audit trail for debugging

## Security & Compliance

### Tamper Evidence
- SHA-256 hashing at ingest
- Chain hashing through pipeline
- Extraction SHA-256 for output verification

### Data Handling
- Local processing only (no external API calls)
- Temporary file cleanup
- Audit trail preservation

## Deployment Architecture

```
Local Machine (CPU-only)
├── Python Environment
│   ├── Core Pipeline (Stages 1-7)
│   ├── spaCy Models (en_core_web_lg)
│   └── OpenCV + Tesseract
├── Ollama Server
│   └── Qwen2.5:7b Model
└── File System
    ├── Input PDFs
    ├── Output JSON
    └── Debug/Logging
```

## Future Enhancements

### Immediate Priorities (by ROI)
1. **Stage 1-3 (Pipeline A)**: Basic digital PDF processing
2. **Stage 4**: NLP extraction with regex tuning
3. **Stage 5**: Section detection (highest complexity, needs real PDF testing)
4. **Stage 6**: LLM integration once sections work
5. **Stage 3 (Pipeline B)**: OCR for scanned documents

### Advanced Features
- Batch processing capabilities
- Web interface for document upload
- Quality metrics dashboard
- Model fine-tuning on domain-specific data
- GPU acceleration when available

## Testing Strategy

### Unit Testing
- Individual stage validation
- Regex pattern verification
- Section detection accuracy
- LLM prompt effectiveness

### Integration Testing
- End-to-end pipeline validation
- Mixed document type handling
- Error condition testing
- Performance benchmarking

### Validation Data
- Real Karnataka HC judgments
- Various document sizes and formats
- Edge cases (corrupt PDFs, mixed layouts)
- Ground truth comparison datasets