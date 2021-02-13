#include "lame.h"

#include <stdarg.h>
#include <stdio.h>
#include <string>
#include <memory>
#include <vector>
#include <utility>

#include <emscripten.h>
#include <emscripten/html5.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;

static void ensure(int ret) {
    if (ret < 0) {
        emscripten_throw_number(ret);
    }
}

std::string fmt(const char* format, va_list args) {
    va_list size_args;
    va_copy(size_args, args);
    int size = vsnprintf(nullptr, 0, format, size_args) + 1;
    std::unique_ptr<char[]> buf(new char[size]);
    vsnprintf(buf.get(), size, format, args);
    va_end(size_args);
    return std::string(buf.get(), buf.get() + size - 1);
}

void log(const char* format, va_list args) {
    std::string msg = fmt(format, args);
    emscripten_console_log(msg.c_str());
}

void warn(const char* format, va_list args) {
    std::string msg = fmt(format, args);
    emscripten_console_warn(msg.c_str());
}

void error(const char* format, va_list args) {
    std::string msg = fmt(format, args);
    emscripten_console_error(msg.c_str());
}

struct LAME {
    lame_global_flags* lame;
    std::vector<unsigned char> buf;
    int written;

    void validate() {
        if (!lame) {
            emscripten_throw_string("lame is null");
        }
    }

    LAME(lame_global_flags* inner, int size) : lame(inner), buf(size), written(0) {
        validate();
        ensure(lame_init_params(lame));
    }

    LAME(LAME&& original) : lame(original.lame), buf(original.buf), written(original.written) {
        original.lame = nullptr;
    }

    void encode(val pcmVal) {
        validate();
        std::vector<short> pcm = vecFromJSArray<short>(pcmVal);
        int ret = lame_encode_buffer_interleaved(lame, pcm.data(), pcm.size(), buf.data() + written, buf.size() - written);
        ensure(ret);
        written += ret;
    }

    void flush() {
        validate();
        int ret = lame_encode_flush(lame, buf.data() + written, buf.size() - written);
        ensure(ret);
        written += ret;
    }

    val buffer() {
        validate();
        return val(typed_memory_view(written, buf.data()));
    }

    ~LAME() {
        if (lame) {
            lame_close(lame);
        }
    }
};

struct LAMEConfig {
    lame_global_flags* lame;

    LAMEConfig() {
        lame = lame_init();
        ensure(lame_set_errorf(lame, error));
        ensure(lame_set_debugf(lame, log));
        ensure(lame_set_msgf(lame, warn));
    }

    void validate() {
        if (!lame) {
            emscripten_throw_string("LAMEConfig already built");
        }
    }

    void setChannels(int channels) {
        validate();
        ensure(lame_set_num_channels(lame, channels));
    }

    void setInputSampleRate(int sampleRate) {
        validate();
        ensure(lame_set_in_samplerate(lame, sampleRate));
    }

    void setOutputSampleRate(int sampleRate) {
        validate();
        ensure(lame_set_out_samplerate(lame, sampleRate));
    }

    void setBitrate(int bitrate) {
        validate();
        ensure(lame_set_brate(lame, bitrate));
    }

    LAME build(int size) {
        LAME built(lame, size);

        lame = nullptr;

        return std::move(built);
    }

    ~LAMEConfig() {
        lame_close(lame);
    }
};

EMSCRIPTEN_BINDINGS(libmp3lame) {
    class_<LAME>("LAME")
        .function("encode", &LAME::encode)
        .function("flush", &LAME::flush)
        .function("buffer", &LAME::buffer)
        ;
    class_<LAMEConfig>("LAMEConfig")
        .constructor<>()
        .function("setChannels", &LAMEConfig::setChannels)
        .function("setInputSampleRate", &LAMEConfig::setInputSampleRate)
        .function("setOutputSampleRate", &LAMEConfig::setOutputSampleRate)
        .function("setBitrate", &LAMEConfig::setBitrate)
        .function("build", &LAMEConfig::build)
        ;
}
