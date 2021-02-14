{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-20.09";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in rec {
        packages = rec {
          binaryen = (pkgs.binaryen.override {
            inherit emscripten;
          }).overrideAttrs (oldAttrs: rec {
            version = "99";
            src = pkgs.fetchFromGitHub {
              owner = "WebAssembly";
              repo = "binaryen";
              hash = "sha256-LAa2NzLhGNynFilDHDjJTf8mVY0XKGNryrkiF2rv0ag=";
              rev = "version_${version}";
            };
            patches = [];
          });
          emscripten = (pkgs.emscripten.override {
            inherit binaryen;
          }).overrideAttrs (oldAttrs: rec {
            version = "2.0.9";
            src = pkgs.fetchFromGitHub {
              owner = "emscripten-core";
              repo = "emscripten";
              hash = "sha256-nEPJQjA+LCRLW/sKPV3u29EwGLhdxLFOQAx7wJFXtnU=";
              rev = version;
            };
            installPhase = builtins.replaceStrings [ "emlink.py" "python tests" ] [ "" "# " ] oldAttrs.installPhase;
          });
          buildEmscriptenPackage = pkgs.buildEmscriptenPackage.override {
            inherit emscripten;
          };
          emscriptenStdenv = pkgs.stdenv // { mkDerivation = buildEmscriptenPackage; };
          lame = (pkgs.lame.override {
            nasmSupport = false;
            nasm = null;
            cpmlSupport = false;
            analyzerHooksSupport = false;
            decoderSupport = false;
            frontendSupport = false;
            stdenv = emscriptenStdenv;
          }).overrideAttrs (oldAttrs: {
            configurePhase = ''
            HOME=$TMPDIR/home
            export EM_CACHE=$TMPDIR/cache

            runHook preConfigure

            emconfigure ./configure --prefix=$out $configureFlags CFLAGS='-O3 -flto'

            runHook postConfigure
            '';
            postBuild = ''
            pushd libmp3lame/.libs/
            emcc \
              -O3 -flto \
              -I ../../include/ \
              --bind ${./bindings.cpp} \
              ./libmp3lame.so \
              -o ./libmp3lame.js \
              -s ALLOW_MEMORY_GROWTH=1 \
              -s MALLOC=emmalloc \
              -s MODULARIZE=1
            popd
            '';
            outputs = [ "out" ];
            installPhase = ''
            mkdir -p $out/lib
            cp libmp3lame/.libs/*.js libmp3lame/.libs/*.wasm $out/lib/
            '';
            doCheck = false;
          });
        };
        devShell = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [ nodejs-14_x ];
        };
      }
    );
}
